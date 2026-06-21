import { Job } from '../models/Job.js';
import { Profile, IProfile } from '../models/Profile.js';
import { Resume } from '../models/Resume.js';
import { CoverLetter } from '../models/CoverLetter.js';
import { Report } from '../models/Report.js';
import {
  researchCompany,
  predictSalary,
  generateAutoApplyChecklist,
} from '../ai/prompts/index.js';
import { getAllSkills, calculateJobMatch } from './recommendation.service.js';
import { AppError } from '../middleware/errorHandler.js';

async function getProfileContext(userId: string): Promise<{ profile: IProfile; context: string }> {
  const profile = await Profile.findOne({ userId });
  if (!profile) throw new AppError('Profile not found', 404);

  const context = JSON.stringify({
    education: profile.education,
    targetRole: profile.careerPreferences.targetRole,
    skills: getAllSkills(profile),
    scores: {
      ats: profile.atsScore,
      coding: profile.codingScore,
      interview: profile.interviewScore,
    },
    expectedSalary: profile.careerPreferences.expectedSalary,
  });

  return { profile, context };
}

export async function runCompanyResearch(userId: string, jobId: string) {
  const job = await Job.findById(jobId);
  if (!job) throw new AppError('Job not found', 404);

  const { profile, context } = await getProfileContext(userId);
  const research = await researchCompany(userId, job.company, job.description, context);

  const match = calculateJobMatch(
    profile,
    job.skills,
    job.title,
    job.location,
    job.jobType,
    job.workMode
  );

  const report = await Report.create({
    userId,
    type: 'company_research',
    title: `Company Research: ${job.company}`,
    data: { ...research, jobId, matchScore: match.totalScore },
    score: research.fitScore,
  });

  return { research, report, job };
}

export async function runSalaryPrediction(userId: string, jobId?: string, role?: string, location?: string) {
  const { profile } = await getProfileContext(userId);
  const skills = getAllSkills(profile);

  let targetRole = role ?? profile.careerPreferences.targetRole;
  let targetLocation = location ?? profile.location ?? profile.careerPreferences.preferredLocations[0] ?? 'Remote';
  let experience = '0-2 years (Fresher)';

  if (jobId) {
    const job = await Job.findById(jobId);
    if (!job) throw new AppError('Job not found', 404);
    targetRole = job.title;
    targetLocation = job.location;
    experience = job.experience;
  }

  const prediction = await predictSalary(
    userId,
    targetRole,
    targetLocation,
    experience,
    skills,
    profile.careerPreferences.expectedSalary
  );

  const report = await Report.create({
    userId,
    type: 'salary_prediction',
    title: `Salary Prediction: ${targetRole}`,
    data: { ...prediction, jobId },
    score: prediction.marketPercentile,
  });

  return { prediction, report };
}

export async function prepareAutoApply(userId: string, jobId: string) {
  const job = await Job.findById(jobId);
  if (!job) throw new AppError('Job not found', 404);

  const { profile, context } = await getProfileContext(userId);

  const [resume, coverLetter] = await Promise.all([
    Resume.findOne({ userId, isActive: true }).sort({ createdAt: -1 }),
    CoverLetter.findOne({ userId, jobId }),
  ]);

  const match = calculateJobMatch(
    profile,
    job.skills,
    job.title,
    job.location,
    job.jobType,
    job.workMode
  );

  const checklist = await generateAutoApplyChecklist(
    userId,
    job.description,
    context,
    !!resume,
    !!coverLetter,
    resume?.analysis?.atsScore ?? profile.atsScore,
    match.totalScore
  );

  const report = await Report.create({
    userId,
    type: 'auto_apply',
    title: `Apply Prep: ${job.title} at ${job.company}`,
    data: { ...checklist, jobId, company: job.company, jobTitle: job.title },
    score: checklist.readinessScore,
  });

  return { checklist, report, job, hasResume: !!resume, hasCoverLetter: !!coverLetter };
}

export async function getCompanyResearchHistory(userId: string, jobId: string) {
  return Report.findOne({ userId, type: 'company_research', 'data.jobId': jobId }).sort({ createdAt: -1 });
}

export async function getSalaryPredictionHistory(userId: string, jobId?: string) {
  const query: Record<string, unknown> = { userId, type: 'salary_prediction' };
  if (jobId) query['data.jobId'] = jobId;
  return Report.findOne(query).sort({ createdAt: -1 });
}
