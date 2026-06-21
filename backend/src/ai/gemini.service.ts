import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { env } from '../config/env.js';
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

function isRetryableModelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('404') ||
    message.includes('429') ||
    message.includes('not found') ||
    message.includes('Too Many Requests')
  );
}

function toAiError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('API key') || message.includes('API_KEY_INVALID')) {
    return new AppError('Invalid Gemini API key. Check GEMINI_API_KEY in backend .env', 503);
  }

  if (message.includes('429') || message.includes('Too Many Requests')) {
    return new AppError('AI service is rate limited. Please try again in a minute.', 429);
  }

  if (message.includes('404') || message.includes('not found')) {
    return new AppError('Configured AI model is unavailable. Update GEMINI_MODEL in backend .env', 503);
  }

  logger.error('Gemini request failed', { error: message });
  return new AppError('AI request failed. Please try again.', 502);
}

class GeminiService {
  private client: GoogleGenerativeAI;
  private modelNames: string[];

  constructor() {
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.modelNames = [
      env.GEMINI_MODEL,
      ...FALLBACK_MODELS.filter((model) => model !== env.GEMINI_MODEL),
    ];
  }

  private getModel(modelName: string, systemInstruction?: string): GenerativeModel {
    return this.client.getGenerativeModel({
      model: modelName,
      ...(systemInstruction ? { systemInstruction } : {}),
    });
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

  private async runWithModelFallback<T>(
    operation: (model: GenerativeModel, modelName: string) => Promise<T>
  ): Promise<T> {
    let lastError: unknown;

    for (const modelName of this.modelNames) {
      try {
        const model = this.getModel(modelName);
        return await operation(model, modelName);
      } catch (error) {
        lastError = error;
        if (error instanceof AppError) throw error;
        if (!isRetryableModelError(error)) throw toAiError(error);
        logger.warn(`Gemini model unavailable, trying fallback`, { modelName });
      }
    }

    throw toAiError(lastError);
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

    return this.runWithModelFallback(async (model, modelName) => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      await this.trackUsage(userId, feature, text.length);
      logger.info('Gemini JSON response', { feature, model: modelName });
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

    return this.runWithModelFallback(async (model, modelName) => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      await this.trackUsage(userId, feature, text.length);
      logger.info('Gemini text response', { feature, model: modelName });
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

    return this.runWithModelFallback(async (_model, modelName) => {
      const model = this.getModel(modelName, systemPrompt);
      const geminiHistory = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const chatSession = model.startChat({ history: geminiHistory });
      const result = await chatSession.sendMessage(sanitized);
      const text = result.response.text();
      await this.trackUsage(userId, feature, text.length);
      logger.info('Gemini chat response', { feature, model: modelName });
      return text.trim();
    });
  }
}

export const geminiService = new GeminiService();
