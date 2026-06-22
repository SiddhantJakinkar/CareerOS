/** Internshala-style one-way video interview timing (seconds). */
export const VIDEO_INTERVIEW_PREP_SECONDS = 30;
export const VIDEO_INTERVIEW_ANSWER_SECONDS = 120;
export const VIDEO_INTERVIEW_QUESTION_COUNT = 5;

export const VIDEO_INTERVIEW_CONFIG = {
  prepSeconds: VIDEO_INTERVIEW_PREP_SECONDS,
  answerSeconds: VIDEO_INTERVIEW_ANSWER_SECONDS,
  questionCount: VIDEO_INTERVIEW_QUESTION_COUNT,
} as const;
