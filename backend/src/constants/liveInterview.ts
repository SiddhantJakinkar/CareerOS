/** Live AI mock interview — Internshala-style real-time flow */
export const LIVE_INTERVIEW_MAX_QUESTIONS = 6;
export const LIVE_QUESTION_TIME_SECONDS = 120;
export const LIVE_SILENCE_SECONDS = 10;
export const LIVE_POST_SPEECH_SILENCE_SECONDS = 4;
export const LIVE_TOTAL_MAX_MINUTES = 8;

export const LIVE_INTERVIEW_CONFIG = {
  maxQuestions: LIVE_INTERVIEW_MAX_QUESTIONS,
  questionTimeSeconds: LIVE_QUESTION_TIME_SECONDS,
  silenceSeconds: LIVE_SILENCE_SECONDS,
  postSpeechSilenceSeconds: LIVE_POST_SPEECH_SILENCE_SECONDS,
  totalMaxMinutes: LIVE_TOTAL_MAX_MINUTES,
} as const;
