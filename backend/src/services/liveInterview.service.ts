import { Interview, type IInterview, type ILiveInterviewMeta } from '../models/Interview.js';
import { InterviewAnswer } from '../models/InterviewAnswer.js';
import { InterviewInvite } from '../models/InterviewInvite.js';
import { Job } from '../models/Job.js';
import { Profile } from '../models/Profile.js';
import {
  evaluateInterviewAnswer,
  generateLiveInterviewQuestion,
  generateLiveInterviewOverallReview,
  getFallbackOverallReview,
  getSkippedEvaluation,
  type LiveInterviewJobContext,
} from '../ai/prompts/index.js';
import {
  DOMAIN_LABELS,
  inferInterviewDomain,
  inferInterviewDomainFromJob,
  type InterviewDomainId,
} from '../constants/interviewDomains.js';
import { LIVE_INTERVIEW_CONFIG } from '../constants/liveInterview.js';
import { AppError } from '../middleware/errorHandler.js';
import { transcribeAudio } from '../ai/whisper.service.js';

const DOMAIN_LABELS_MAP = DOMAIN_LABELS;

function averageMetric(current: number, next: number): number {
  return Math.round((current + next) / 2) || next;
}

function isMeaningfulAnswer(text: string): boolean {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  return cleaned.length >= 8 && !/^(um+|uh+|hmm+|\.+)$/i.test(cleaned);
}

function jobContextFromMeta(
  meta: ILiveInterviewMeta | undefined,
  targetRole?: string,
  experience?: string
): LiveInterviewJobContext | undefined {
  if (!meta?.jobTitle && !meta?.companyName && !meta?.jobDescription) return undefined;
  return {
    jobTitle: meta.jobTitle,
    companyName: meta.companyName,
    targetRole,
    jobDescription: meta.jobDescription,
    jobSkills: meta.jobSkills,
    experience,
  };
}

export async function resolveInvite(token: string) {
  const invite = await InterviewInvite.findOne({ token });
  if (!invite) throw new AppError('Interview link is invalid or expired', 404);
  if (invite.status === 'used') throw new AppError('This interview link has already been used', 400);
  if (invite.expiresAt < new Date()) {
    invite.status = 'expired';
    await invite.save();
    throw new AppError('This interview link has expired', 410);
  }
  return invite;
}

export async function startLiveInterview(
  userId: string,
  options: {
    domain?: InterviewDomainId;
    inviteToken?: string;
    jobId?: string;
    jobTitle?: string;
    companyName?: string;
  }
): Promise<{ interview: IInterview; currentQuestion: string; config: typeof LIVE_INTERVIEW_CONFIG }> {
  let domain = options.domain;
  let jobTitle = options.jobTitle;
  let companyName = options.companyName;
  let jobDescription: string | undefined;
  let jobSkills: string[] | undefined;
  let jobExperience: string | undefined;
  let jobRefId;
  let maxQuestions: number = LIVE_INTERVIEW_CONFIG.maxQuestions;
  let inviteId;

  if (options.inviteToken) {
    const invite = await resolveInvite(options.inviteToken);
    domain = invite.domain;
    jobTitle = invite.jobTitle;
    companyName = invite.companyName;
    maxQuestions = invite.maxQuestions;
    inviteId = invite._id;
  } else if (options.jobId) {
    const job = await Job.findById(options.jobId);
    if (!job) throw new AppError('Job not found', 404);
    domain = inferInterviewDomainFromJob(job);
    jobTitle = job.title;
    companyName = job.company;
    jobDescription = job.description.slice(0, 3000);
    jobSkills = job.skills ?? [];
    jobExperience = job.experience;
    jobRefId = job._id;
  }

  const profile = await Profile.findOne({ userId });

  if (!domain) {
    domain = inferInterviewDomain(profile).domain;
  }

  const domainLabel = DOMAIN_LABELS_MAP[domain] ?? domain;
  const jobContext: LiveInterviewJobContext = {
    jobTitle,
    companyName,
    targetRole: profile?.careerPreferences?.targetRole,
    jobDescription,
    jobSkills,
    experience: jobExperience,
  };

  const firstQuestion = await generateLiveInterviewQuestion(userId, domainLabel, [], jobContext);

  const interview = await Interview.create({
    userId,
    type: 'live',
    domain,
    questions: [firstQuestion],
    currentQuestionIndex: 0,
    status: 'in_progress',
    liveMeta: {
      companyName,
      jobTitle,
      jobId: jobRefId,
      jobDescription,
      jobSkills,
      inviteId,
      maxQuestions,
      questionTimeSeconds: LIVE_INTERVIEW_CONFIG.questionTimeSeconds,
      silenceSeconds: LIVE_INTERVIEW_CONFIG.silenceSeconds,
    },
  });

  if (options.inviteToken && inviteId) {
    await InterviewInvite.findByIdAndUpdate(inviteId, {
      status: 'used',
      usedBy: userId,
      interviewId: interview._id,
    });
  }

  return {
    interview,
    currentQuestion: firstQuestion,
    config: LIVE_INTERVIEW_CONFIG,
  };
}

export async function processLiveTurn(
  userId: string,
  interviewId: string,
  options: {
    transcript?: string;
    skipped?: boolean;
    silenceTimeout?: boolean;
    afterRetry?: boolean;
    durationSeconds?: number;
    audioBuffer?: Buffer;
    audioMime?: string;
  }
): Promise<{
  interview: IInterview;
  evaluation: Awaited<ReturnType<typeof evaluateInterviewAnswer>> | ReturnType<typeof getSkippedEvaluation>;
  transcript: string;
  nextQuestion: string | null;
  isComplete: boolean;
  questionNumber: number;
  wasSkipped: boolean;
}> {
  const interview = await Interview.findOne({
    _id: interviewId,
    userId,
    type: 'live',
    status: 'in_progress',
  });
  if (!interview) throw new AppError('Live interview not found or already completed', 404);

  const question = interview.questions[interview.currentQuestionIndex];
  const domainLabel = DOMAIN_LABELS_MAP[interview.domain as InterviewDomainId] ?? interview.domain;
  const maxQ = interview.liveMeta?.maxQuestions ?? LIVE_INTERVIEW_CONFIG.maxQuestions;
  const profile = await Profile.findOne({ userId });
  const jobContext = jobContextFromMeta(
    interview.liveMeta,
    profile?.careerPreferences?.targetRole
  );

  let transcript = (options.transcript ?? '').trim();

  if (!transcript && options.audioBuffer && options.audioMime) {
    try {
      transcript = await transcribeAudio(options.audioBuffer, options.audioMime);
    } catch {
      transcript = '';
    }
  }

  const skipped =
    !isMeaningfulAnswer(transcript) &&
    !!(options.skipped || options.silenceTimeout || options.afterRetry);

  let evaluation: Awaited<ReturnType<typeof evaluateInterviewAnswer>>;

  if (skipped) {
    evaluation = getSkippedEvaluation();
    if (options.silenceTimeout) {
      evaluation.feedback =
        options.afterRetry
          ? 'No response was provided even after I repeated the question.'
          : 'No response was detected.';
    }
    transcript = transcript || '(no answer)';
  } else {
    evaluation = await evaluateInterviewAnswer(userId, question, transcript, domainLabel, jobContext);
  }

  await InterviewAnswer.create({
    interviewId: interview._id,
    userId,
    questionIndex: interview.currentQuestionIndex,
    question,
    answer: transcript,
    transcript,
    durationSeconds: options.durationSeconds ?? 0,
    evaluation: {
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
    },
  });

  if (!skipped) {
    interview.metrics.technicalKnowledge = averageMetric(
      interview.metrics.technicalKnowledge,
      evaluation.technicalKnowledge
    );
    interview.metrics.communication = averageMetric(
      interview.metrics.communication,
      evaluation.communication
    );
    interview.metrics.confidence = averageMetric(
      interview.metrics.confidence,
      evaluation.confidence
    );
    interview.metrics.problemSolving = averageMetric(
      interview.metrics.problemSolving,
      evaluation.problemSolving
    );
    interview.metrics.clarity = averageMetric(interview.metrics.clarity, evaluation.clarity);
  }

  interview.currentQuestionIndex += 1;
  const answeredCount = interview.currentQuestionIndex;
  const isComplete = answeredCount >= maxQ;

  let nextQuestion: string | null = null;

  if (!isComplete) {
    const priorAnswers = await InterviewAnswer.find({ interviewId: interview._id }).sort({
      questionIndex: 1,
    });
    const history = priorAnswers.map((a) => ({
      question: a.question,
      answer: a.answer,
      skipped: a.evaluation.score === 0 && a.answer === '(no answer)',
    }));

    nextQuestion = await generateLiveInterviewQuestion(userId, domainLabel, history, jobContext);

    interview.questions.push(nextQuestion);
  } else {
    interview.status = 'completed';
    interview.completedAt = new Date();

    const allAnswers = await InterviewAnswer.find({ interviewId: interview._id }).sort({
      questionIndex: 1,
    });
    const answeredOnly = allAnswers.filter((a) => a.evaluation.score > 0).length;

    if (answeredOnly > 0) {
      interview.overallScore = Math.round(
        (interview.metrics.technicalKnowledge +
          interview.metrics.communication +
          interview.metrics.confidence +
          interview.metrics.problemSolving +
          interview.metrics.clarity) /
          5
      );
    } else {
      interview.overallScore = 0;
    }

    let overallReview;

    try {
      overallReview = await generateLiveInterviewOverallReview(
        userId,
        domainLabel,
        interview.metrics,
        allAnswers.map((a) => ({
          question: a.question,
          answer: a.answer,
          score: a.evaluation.score,
          feedback: a.evaluation.feedback,
          skipped: a.evaluation.score === 0 && a.answer === '(no answer)',
        })),
        jobContextFromMeta(interview.liveMeta, profile?.careerPreferences?.targetRole)
      );
    } catch {
      overallReview = getFallbackOverallReview(interview.metrics, answeredOnly);
    }

    interview.feedback = overallReview.overallReview;
    interview.suggestions = overallReview.suggestions;
    interview.strengths = overallReview.strengths;
    interview.focusAreas = overallReview.focusAreas;
  }

  await interview.save();

  return {
    interview,
    evaluation,
    transcript,
    nextQuestion,
    isComplete,
    questionNumber: answeredCount,
    wasSkipped: skipped,
  };
}
