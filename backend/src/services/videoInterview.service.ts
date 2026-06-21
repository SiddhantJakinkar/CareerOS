import { VideoInterview } from '../models/VideoInterview.js';
import { Profile } from '../models/Profile.js';
import { Report } from '../models/Report.js';
import { uploadVideoToCloudinary } from '../config/cloudinary.js';
import { transcribeAudio } from '../ai/whisper.service.js';
import { analyzeVideoInterview } from '../ai/prompts/index.js';
import { updatePlacementReadiness, logActivity, createNotification } from './recommendation.service.js';
import { Interview } from '../models/Interview.js';
import { AppError } from '../middleware/errorHandler.js';
import { INTERVIEW_DOMAIN_IDS } from '../constants/interviewDomains.js';

export async function processVideoInterview(
  userId: string,
  file: Express.Multer.File,
  title: string,
  domain: string
) {
  const { url, publicId, duration } = await uploadVideoToCloudinary(file.buffer, 'video-interviews');

  const record = await VideoInterview.create({
    userId,
    title: title || 'Video Interview',
    domain: domain || 'general',
    videoUrl: url,
    publicId,
    fileName: file.originalname,
    fileSize: file.size,
    status: 'processing',
  });

  try {
    const transcript = await transcribeAudio(file.buffer, file.mimetype);
    const durationSeconds = duration ?? Math.round(file.size / 16000);

    const analysis = await analyzeVideoInterview(userId, transcript, domain, durationSeconds);

    record.analysis = {
      ...analysis,
      transcript,
      durationSeconds,
    };
    record.status = 'completed';
    await record.save();

    const avgInterviewScore = Math.round(
      (analysis.communication + analysis.confidence + analysis.clarity + analysis.structure) / 4
    );

    await Profile.findOneAndUpdate({ userId }, { interviewScore: avgInterviewScore });
    await updatePlacementReadiness(userId);

    await Report.create({
      userId,
      type: 'video_interview',
      title: `Video Interview: ${record.title}`,
      data: { videoInterviewId: record._id, analysis: record.analysis },
      score: analysis.overallScore,
    });

    const interviewDomain = INTERVIEW_DOMAIN_IDS.includes(domain as (typeof INTERVIEW_DOMAIN_IDS)[number])
      ? (domain as (typeof INTERVIEW_DOMAIN_IDS)[number])
      : 'hr';

    await Interview.create({
      userId,
      type: 'mock',
      domain: interviewDomain,
      status: 'completed',
      overallScore: analysis.overallScore,
      metrics: {
        technicalKnowledge: analysis.structure,
        communication: analysis.communication,
        confidence: analysis.confidence,
        problemSolving: analysis.clarity,
        clarity: analysis.clarity,
      },
      feedback: analysis.feedback,
      suggestions: analysis.improvements,
      completedAt: new Date(),
    });

    await createNotification(
      userId,
      'Video Analysis Complete',
      `Your score: ${analysis.overallScore}%`,
      'interview',
      '/ai-interview'
    );

    await logActivity(userId, 'analyze', 'video_interview', record._id.toString());

    return record;
  } catch (error) {
    record.status = 'failed';
    await record.save();
    throw error;
  }
}

export async function getVideoInterviews(userId: string) {
  return VideoInterview.find({ userId }).sort({ createdAt: -1 });
}

export async function getVideoInterview(userId: string, id: string) {
  const record = await VideoInterview.findOne({ _id: id, userId });
  if (!record) throw new AppError('Video interview not found', 404);
  return record;
}

export async function deleteVideoInterview(userId: string, id: string) {
  const record = await VideoInterview.findOneAndDelete({ _id: id, userId });
  if (!record) throw new AppError('Video interview not found', 404);
  return record;
}
