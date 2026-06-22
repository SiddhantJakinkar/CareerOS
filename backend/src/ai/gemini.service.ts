import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { env } from '../config/env.js';
import { loadGeminiApiKeys } from '../config/geminiKeys.js';
import { sanitizeForAI } from '../utils/sanitize.js';
import { TokenUsage } from '../models/TokenUsage.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const TOKEN_LIMITS: Record<string, number> = {
  ats_analysis: 4000,
  interview_evaluation: 3000,
  resume_generation: 5000,
  cover_letter: 2500,
  roadmap: 2000,
  skill_gap: 3000,
  job_match: 2000,
  linkedin: 3000,
  auto_apply: 2500,
  career_chat: 4000,
  company_research: 3000,
  salary_prediction: 2000,
  video_interview: 4000,
  default: 4000,
};

const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

/** How long to skip a key after 429 / quota errors (ms). */
const KEY_COOLDOWN_MS = 60_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRetryableKeyError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('too many requests') ||
    message.includes('resource_exhausted') ||
    message.includes('resource exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('rate_limit') ||
    message.includes('api_key_invalid') ||
    message.includes('api key not valid') ||
    message.includes('permission denied') ||
    message.includes('403') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('unavailable') ||
    message.includes('overloaded')
  );
}

function isRetryableModelError(error: unknown): boolean {
  const message = errorMessage(error);
  return (
    message.includes('404') ||
    message.includes('429') ||
    message.includes('not found') ||
    message.includes('Too Many Requests')
  );
}

function isRateLimitError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('too many requests') ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit')
  );
}

function toAiError(error: unknown, keysTried: number): AppError {
  const message = errorMessage(error);

  if (message.includes('API key') || message.includes('API_KEY_INVALID')) {
    if (keysTried > 1) {
      return new AppError('All configured Gemini API keys failed. Check GEMINI_API_KEYS in backend .env', 503);
    }
    return new AppError('Invalid Gemini API key. Check GEMINI_API_KEY in backend .env', 503);
  }

  if (message.includes('429') || message.includes('Too Many Requests') || message.toLowerCase().includes('quota')) {
    return new AppError('AI service is rate limited on all keys. Please try again in a minute.', 429);
  }

  if (message.includes('404') || message.includes('not found')) {
    return new AppError('Configured AI model is unavailable. Update GEMINI_MODEL in backend .env', 503);
  }

  logger.error('Gemini request failed after key fallback', { error: message, keysTried });
  return new AppError('AI request failed. Please try again.', 502);
}

class GeminiService {
  private readonly apiKeys: string[];
  private readonly modelNames: string[];
  /** Prefer this key index on the next request (round-robin after failures). */
  private preferredKeyIndex = 0;
  /** key index → cooldown expiry timestamp */
  private readonly keyCooldownUntil = new Map<number, number>();

  constructor() {
    this.apiKeys = loadGeminiApiKeys();
    if (this.apiKeys.length === 0) {
      throw new Error('No Gemini API keys configured. Set GEMINI_API_KEY or GEMINI_API_KEYS in backend .env');
    }
    this.modelNames = [
      env.GEMINI_MODEL,
      ...FALLBACK_MODELS.filter((model) => model !== env.GEMINI_MODEL),
    ];
    logger.info('Gemini key pool initialized', { keyCount: this.apiKeys.length });
  }

  private getClient(apiKey: string): GoogleGenerativeAI {
    return new GoogleGenerativeAI(apiKey);
  }

  private getModel(client: GoogleGenerativeAI, modelName: string, systemInstruction?: string): GenerativeModel {
    return client.getGenerativeModel({
      model: modelName,
      ...(systemInstruction ? { systemInstruction } : {}),
    });
  }

  private isKeyAvailable(keyIndex: number): boolean {
    const until = this.keyCooldownUntil.get(keyIndex);
    return until === undefined || Date.now() >= until;
  }

  private markKeyCooldown(keyIndex: number): void {
    this.keyCooldownUntil.set(keyIndex, Date.now() + KEY_COOLDOWN_MS);
    logger.warn('Gemini API key on cooldown', {
      keySlot: keyIndex + 1,
      cooldownSec: KEY_COOLDOWN_MS / 1000,
    });
  }

  /** Key order: preferred first, then rotate through the rest (skipping cooled-down keys when possible). */
  private getKeyAttemptOrder(): number[] {
    const n = this.apiKeys.length;
    const order: number[] = [];

    for (let offset = 0; offset < n; offset++) {
      const idx = (this.preferredKeyIndex + offset) % n;
      if (this.isKeyAvailable(idx)) {
        order.push(idx);
      }
    }

    // If every key is on cooldown, try all anyway
    if (order.length === 0) {
      for (let offset = 0; offset < n; offset++) {
        order.push((this.preferredKeyIndex + offset) % n);
      }
    }

    return order;
  }

  private async trackUsage(userId: string, feature: string, estimatedTokens: number): Promise<void> {
    try {
      await TokenUsage.create({ userId, feature, tokensUsed: estimatedTokens });
    } catch (error) {
      logger.warn('Failed to track token usage', { error });
    }
  }

  private parseJsonResponse<T>(text: string): T {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      }
      throw new AppError('AI returned an invalid response. Please try again.', 502);
    }
  }

  private async runWithKeyAndModelFallback<T>(
    operation: (
      client: GoogleGenerativeAI,
      model: GenerativeModel,
      modelName: string,
      keyIndex: number
    ) => Promise<T>,
    options?: { systemInstruction?: string }
  ): Promise<T> {
    const keyOrder = this.getKeyAttemptOrder();
    let lastError: unknown;
    let keysAttempted = 0;

    for (const keyIndex of keyOrder) {
      keysAttempted++;
      const client = this.getClient(this.apiKeys[keyIndex]);
      let keyFailed = false;

      for (const modelName of this.modelNames) {
        try {
          const model = this.getModel(client, modelName, options?.systemInstruction);
          const result = await operation(client, model, modelName, keyIndex);
          this.preferredKeyIndex = keyIndex;
          this.keyCooldownUntil.delete(keyIndex);
          return result;
        } catch (error) {
          lastError = error;

          // JSON parse / operational errors — do not burn through keys
          if (error instanceof AppError) {
            throw error;
          }

          if (isRateLimitError(error)) {
            this.markKeyCooldown(keyIndex);
          }

          if (isRetryableKeyError(error)) {
            logger.warn('Gemini API key failed, trying next key', {
              keySlot: keyIndex + 1,
              totalKeys: this.apiKeys.length,
              model: modelName,
              reason: errorMessage(error).slice(0, 120),
            });
            keyFailed = true;
            break;
          }

          if (isRetryableModelError(error)) {
            logger.warn('Gemini model unavailable on current key, trying fallback model', {
              keySlot: keyIndex + 1,
              model: modelName,
            });
            continue;
          }

          keyFailed = true;
          break;
        }
      }

      if (!keyFailed) continue;
    }

    throw toAiError(lastError, keysAttempted);
  }

  async generateJSON<T>(
    userId: string,
    feature: string,
    systemPrompt: string,
    userContent: string
  ): Promise<T> {
    const limit = TOKEN_LIMITS[feature] ?? TOKEN_LIMITS.default;
    const sanitized = sanitizeForAI(userContent, limit);

    const prompt = `${systemPrompt}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no explanation outside JSON.

User Content:
${sanitized}`;

    return this.runWithKeyAndModelFallback(async (_client, model, modelName, keyIndex) => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      await this.trackUsage(userId, feature, text.length);
      logger.info('Gemini JSON response', { feature, model: modelName, keySlot: keyIndex + 1 });
      return this.parseJsonResponse<T>(text);
    });
  }

  async generateText(
    userId: string,
    feature: string,
    systemPrompt: string,
    userContent: string
  ): Promise<string> {
    const limit = TOKEN_LIMITS[feature] ?? TOKEN_LIMITS.default;
    const sanitized = sanitizeForAI(userContent, limit);

    const prompt = `${systemPrompt}

User Content:
${sanitized}`;

    return this.runWithKeyAndModelFallback(async (_client, model, modelName, keyIndex) => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      await this.trackUsage(userId, feature, text.length);
      logger.info('Gemini text response', { feature, model: modelName, keySlot: keyIndex + 1 });
      return text.trim();
    });
  }

  async chat(
    userId: string,
    feature: string,
    systemPrompt: string,
    history: Array<{ role: 'user' | 'model'; content: string }>,
    userMessage: string
  ): Promise<string> {
    const limit = TOKEN_LIMITS[feature] ?? TOKEN_LIMITS.default;
    const sanitized = sanitizeForAI(userMessage, limit);

    return this.runWithKeyAndModelFallback(
      async (_client, model, modelName, keyIndex) => {
        const geminiHistory = history.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }));

        const chatSession = model.startChat({ history: geminiHistory });
        const result = await chatSession.sendMessage(sanitized);
        const text = result.response.text();
        await this.trackUsage(userId, feature, text.length);
        logger.info('Gemini chat response', { feature, model: modelName, keySlot: keyIndex + 1 });
        return text.trim();
      },
      { systemInstruction: systemPrompt }
    );
  }
}

export const geminiService = new GeminiService();
