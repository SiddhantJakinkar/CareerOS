import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { transcribeAudio } from '../ai/whisper.service.js';
import { Interview } from '../models/Interview.js';
import { evaluateInterviewAnswer } from '../ai/prompts/index.js';
import { InterviewAnswer } from '../models/InterviewAnswer.js';
import { AppError } from '../middleware/errorHandler.js';
import { updatePlacementReadiness, createNotification } from '../services/recommendation.service.js';
import { Report } from '../models/Report.js';

export const voiceEvaluateSchema = z.object({
  interviewId: z.string().min(1),
});

export async function transcribeVoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError('No audio file uploaded', 400);

    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);
    res.json({ success: true, data: { transcript } });
  } catch (error) {
    next(error);
  }
}

export async function evaluateVoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { interviewId, transcript: textAnswer } = req.body;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
      type: { $in: ['voice', 'video'] },
    });
    if (!interview) throw new AppError('Voice interview not found', 404);

    let transcript = typeof textAnswer === 'string' ? textAnswer.trim() : '';
    if (!transcript) {
      if (!req.file) throw new AppError('No audio file uploaded', 400);
      transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);
    }

    if (!transcript) throw new AppError('Could not transcribe your answer. Type your response instead.', 400);
    const question = interview.questions[interview.currentQuestionIndex];

    const evaluation = await evaluateInterviewAnswer(userId, question, transcript, interview.domain);

    await InterviewAnswer.create({
      interviewId: interview._id,
      userId,
      questionIndex: interview.currentQuestionIndex,
      question,
      answer: transcript,
      transcript,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      },
    });

    interview.currentQuestionIndex += 1;
    const isComplete = interview.currentQuestionIndex >= interview.questions.length;

    if (isComplete) {
      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.overallScore = evaluation.score;
      interview.metrics.technicalKnowledge = Math.round(
        (interview.metrics.technicalKnowledge + evaluation.technicalKnowledge) / 2 ||
          evaluation.technicalKnowledge
      );
      interview.metrics.communication = Math.round(
        (interview.metrics.communication + evaluation.communication) / 2 || evaluation.communication
      );
      interview.metrics.confidence = Math.round(
        (interview.metrics.confidence + evaluation.confidence) / 2 || evaluation.confidence
      );
      interview.metrics.problemSolving = Math.round(
        (interview.metrics.problemSolving + evaluation.problemSolving) / 2 ||
          evaluation.problemSolving
      );
      interview.metrics.clarity = Math.round(
        (interview.metrics.clarity + evaluation.clarity) / 2 || evaluation.clarity
      );
      interview.feedback = evaluation.feedback;
      interview.suggestions = evaluation.improvements;

      await Report.create({
        userId,
        type: 'interview',
        title: `${interview.domain.toUpperCase()} AI Interview Report`,
        data: { metrics: interview.metrics, overallScore: interview.overallScore, interviewId: interview._id },
        score: interview.overallScore,
      });

      await updatePlacementReadiness(userId);
      await createNotification(
        userId,
        'AI Interview Complete',
        `Your score: ${interview.overallScore}%`,
        'interview',
        '/ai-interview'
      );
    }

    await interview.save();

    res.json({
      success: true,
      data: {
        transcript,
        evaluation,
        nextQuestion: isComplete ? null : interview.questions[interview.currentQuestionIndex],
        isComplete,
      },
    });
  } catch (error) {
    next(error);
  }
}
