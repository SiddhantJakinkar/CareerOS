import { Profile, IProfile } from '../models/Profile.js';
import { Resume } from '../models/Resume.js';
import { CodingResult } from '../models/CodingResult.js';
import { Interview } from '../models/Interview.js';
import { logger } from '../utils/logger.js';
import { getAllSkillsFromProfile, getReadinessWeights, isTechStream } from '../constants/academicStreams.js';
import { invalidateUserCaches } from '../utils/cache.js';

export function getAllSkills(profile: IProfile): string[] {
  return getAllSkillsFromProfile(profile);
}

export interface MatchScoreBreakdown {
  skillsMatch: number;
  preferencesMatch: number;
  educationMatch: number;
  codingScore: number;
  interviewScore: number;
  locationMatch: number;
  totalScore: number;
  missingSkills: string[];
  reason: string;
}

export function calculateJobMatch(
  profile: IProfile,
  jobSkills: string[],
  jobTitle: string,
  jobLocation: string,
  jobType: string,
  jobWorkMode: string
): MatchScoreBreakdown {
  const userSkills = getAllSkills(profile).map((s) => s.toLowerCase());
  const requiredSkills = jobSkills.map((s) => s.toLowerCase());

  let skillsMatch = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  if (requiredSkills.length > 0) {
    for (const skill of requiredSkills) {
      if (userSkills.some((us) => us.includes(skill) || skill.includes(us))) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
    skillsMatch = (matchedSkills.length / requiredSkills.length) * 100;
  } else {
    skillsMatch = 50;
  }

  let preferencesMatch = 0;
  const prefs = profile.careerPreferences;
  const targetRole = (prefs?.targetRole ?? '').toLowerCase();
  if (targetRole && jobTitle.toLowerCase().includes(targetRole)) {
    preferencesMatch += 50;
  }
  if (prefs?.jobType === jobType) preferencesMatch += 25;
  if (prefs?.workMode === jobWorkMode) preferencesMatch += 25;
  preferencesMatch = Math.min(preferencesMatch, 100);

  let educationMatch = 50;
  if (profile.education.degree) educationMatch += 25;
  if (profile.education.branch) educationMatch += 25;
  educationMatch = Math.min(educationMatch, 100);

  const codingScore = profile.codingScore || 0;
  const interviewScore = profile.interviewScore || 0;

  let locationMatch = 50;
  const preferred = (prefs?.preferredLocations ?? []).map((l) => l.toLowerCase());
  if (preferred.some((l) => jobLocation.toLowerCase().includes(l) || l.includes(jobLocation.toLowerCase()))) {
    locationMatch = 100;
  } else if (jobWorkMode === 'remote') {
    locationMatch = 90;
  }

  const codingWeight = isTechStream(profile.academicStream) ? 0.1 : 0.05;
  const skillsWeight = isTechStream(profile.academicStream) ? 0.4 : 0.45;

  const totalScore = Math.round(
    skillsMatch * skillsWeight +
      preferencesMatch * 0.2 +
      educationMatch * 0.15 +
      codingScore * codingWeight +
      interviewScore * 0.1 +
      locationMatch * 0.05
  );

  const reasons: string[] = [];
  if (matchedSkills.length > 0) reasons.push(`Skills match: ${matchedSkills.slice(0, 3).join(', ')}`);
  if (preferencesMatch >= 50) reasons.push('Career preferences aligned');
  if (locationMatch >= 90) reasons.push('Location preference matched');

  return {
    skillsMatch: Math.round(skillsMatch),
    preferencesMatch: Math.round(preferencesMatch),
    educationMatch: Math.round(educationMatch),
    codingScore,
    interviewScore,
    locationMatch: Math.round(locationMatch),
    totalScore,
    missingSkills,
    reason: reasons.join('. ') || 'Based on profile analysis',
  };
}

export async function updatePlacementReadiness(userId: string): Promise<number> {
  const profile = await Profile.findOne({ userId });
  if (!profile) return 0;

  const latestResume = await Resume.findOne({ userId, isActive: true }).sort({ createdAt: -1 });
  if (latestResume?.analysis?.atsScore) {
    profile.atsScore = latestResume.analysis.atsScore;
  }

  const latestCoding = await CodingResult.findOne({ userId }).sort({ completedAt: -1 });
  if (latestCoding) {
    profile.codingScore = latestCoding.percentage;
  }

  const latestInterview = await Interview.findOne({ userId, status: 'completed' }).sort({ completedAt: -1 });
  if (latestInterview) {
    profile.interviewScore = latestInterview.overallScore;
  }

  const weights = getReadinessWeights(profile.academicStream);
  const score = Math.round(
    profile.atsScore * weights.ats +
      profile.codingScore * weights.assessment +
      profile.interviewScore * weights.interview +
      profile.jobMatchScore * weights.jobMatch
  );
  profile.placementReadinessScore = score;
  await profile.save();
  await invalidateUserCaches(userId);

  return score;
}

export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { ActivityLog } = await import('../models/ActivityLog.js');
    await ActivityLog.create({ userId, action, entity, entityId, metadata });
  } catch (error) {
    logger.warn('Failed to log activity', { error });
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'job_match' | 'resume_analysis' | 'interview' | 'application' | 'roadmap' | 'system',
  link?: string
): Promise<void> {
  try {
    const { Notification } = await import('../models/Notification.js');
    await Notification.create({ userId, title, message, type, link });
  } catch (error) {
    logger.warn('Failed to create notification', { error });
  }
}
