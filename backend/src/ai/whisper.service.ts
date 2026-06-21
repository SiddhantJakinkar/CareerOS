import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

interface WhisperResponse {
  text: string;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  if (!env.WHISPER_API_KEY) {
    throw new AppError('Voice transcription service not configured.', 503);
  }

  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHISPER_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      logger.error('Whisper API error', { status: response.status });
      throw new AppError('Failed to transcribe audio.', 500);
    }

    const data = (await response.json()) as WhisperResponse;
    return data.text.trim();
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Whisper transcription failed', { error });
    throw new AppError('Failed to transcribe audio.', 500);
  }
}
