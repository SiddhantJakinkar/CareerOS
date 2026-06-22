import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Application } from '../models/Application.js';
import { Interview } from '../models/Interview.js';
import { CodingResult } from '../models/CodingResult.js';
import { Resume } from '../models/Resume.js';
import { getAssessmentScoreLabel } from '../constants/academicStreams.js';

export interface PlacementOverview {
  totalStudents: number;
  activeStudents: number;
  averageReadiness: number;
  averageAts: number;
  averageCoding: number;
  averageInterview: number;
  placementRate: number;
  applications: {
    total: number;
    applied: number;
    interviews: number;
    selected: number;
    rejected: number;
  };
  readinessDistribution: Array<{ range: string; count: number }>;
  branchBreakdown: Array<{ branch: string; count: number; avgReadiness: number }>;
  topPerformers: Array<{
    userId: string;
    name: string;
    email: string;
    college: string;
    branch: string;
    readiness: number;
    ats: number;
    coding: number;
    interview: number;
    applications: number;
  }>;
  atRiskStudents: Array<{
    userId: string;
    name: string;
    email: string;
    readiness: number;
    weakAreas: string[];
  }>;
  recentPlacements: Array<{
    studentName: string;
    company: string;
    role: string;
    date: Date;
  }>;
}

export async function getPlacementOverview(college?: string): Promise<PlacementOverview> {
  const userQuery: Record<string, unknown> = { role: 'user', onboardingCompleted: true };
  const users = await User.find(userQuery).select('name email _id');
  const userIds = users.map((u) => u._id);

  const profileQuery: Record<string, unknown> = { userId: { $in: userIds } };
  if (college) {
    profileQuery['education.collegeName'] = { $regex: college, $options: 'i' };
  }

  const profiles = await Profile.find(profileQuery).populate('userId', 'name email');

  const filteredUserIds = profiles.map((p) => p.userId);

  const [applications] = await Promise.all([
    Application.find({ userId: { $in: filteredUserIds } }).populate('jobId', 'title company'),
  ]);

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const readinessScores = profiles.map((p) => p.placementReadinessScore);
  const selectedApps = applications.filter((a) =>
    ['selected', 'offer_received'].includes(a.status)
  );

  const readinessDistribution = [
    { range: '0-25', count: readinessScores.filter((s) => s <= 25).length },
    { range: '26-50', count: readinessScores.filter((s) => s > 25 && s <= 50).length },
    { range: '51-75', count: readinessScores.filter((s) => s > 50 && s <= 75).length },
    { range: '76-100', count: readinessScores.filter((s) => s > 75).length },
  ];

  const branchMap = new Map<string, { count: number; totalReadiness: number }>();
  for (const p of profiles) {
    const branch = p.education.branch || 'Unknown';
    const existing = branchMap.get(branch) ?? { count: 0, totalReadiness: 0 };
    existing.count += 1;
    existing.totalReadiness += p.placementReadinessScore;
    branchMap.set(branch, existing);
  }

  const branchBreakdown = Array.from(branchMap.entries()).map(([branch, data]) => ({
    branch,
    count: data.count,
    avgReadiness: Math.round(data.totalReadiness / data.count),
  }));

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const topPerformers = profiles
    .sort((a, b) => b.placementReadinessScore - a.placementReadinessScore)
    .slice(0, 10)
    .map((p) => {
      const user = userMap.get(p.userId.toString());
      const appCount = applications.filter(
        (a) => a.userId.toString() === p.userId.toString()
      ).length;
      return {
        userId: p.userId.toString(),
        name: user?.name ?? 'Unknown',
        email: user?.email ?? '',
        college: p.education.collegeName,
        branch: p.education.branch,
        readiness: p.placementReadinessScore,
        ats: p.atsScore,
        coding: p.codingScore,
        interview: p.interviewScore,
        applications: appCount,
      };
    });

  const atRiskStudents = profiles
    .filter((p) => p.placementReadinessScore < 50)
    .sort((a, b) => a.placementReadinessScore - b.placementReadinessScore)
    .slice(0, 10)
    .map((p) => {
      const user = userMap.get(p.userId.toString());
      const assessmentLabel = getAssessmentScoreLabel(p.academicStream).replace(' Score', '');
      const weakAreas: string[] = [];
      if (p.atsScore < 60) weakAreas.push('Resume/ATS');
      if (p.codingScore < 60) weakAreas.push(assessmentLabel);
      if (p.interviewScore < 60) weakAreas.push('Interview');
      if (p.jobMatchScore < 60) weakAreas.push('Job Match');
      return {
        userId: p.userId.toString(),
        name: user?.name ?? 'Unknown',
        email: user?.email ?? '',
        readiness: p.placementReadinessScore,
        weakAreas: weakAreas.length ? weakAreas : ['Overall readiness'],
      };
    });

  const recentPlacements = selectedApps
    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
    .slice(0, 10)
    .map((a) => {
      const user = userMap.get(a.userId.toString());
      const job = a.jobId as { title?: string; company?: string } | null;
      return {
        studentName: user?.name ?? 'Unknown',
        company: job?.company ?? 'Unknown',
        role: job?.title ?? 'Unknown',
        date: a.updatedAt,
      };
    });

  return {
    totalStudents: profiles.length,
    activeStudents: profiles.filter((p) => p.placementReadinessScore > 0).length,
    averageReadiness: avg(readinessScores),
    averageAts: avg(profiles.map((p) => p.atsScore)),
    averageCoding: avg(profiles.map((p) => p.codingScore)),
    averageInterview: avg(profiles.map((p) => p.interviewScore)),
    placementRate:
      profiles.length > 0
        ? Math.round((selectedApps.length / profiles.length) * 100)
        : 0,
    applications: {
      total: applications.length,
      applied: applications.filter((a) => a.status !== 'saved').length,
      interviews: applications.filter((a) =>
        ['interview_scheduled', 'technical_round', 'hr_round'].includes(a.status)
      ).length,
      selected: selectedApps.length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    },
    readinessDistribution,
    branchBreakdown,
    topPerformers,
    atRiskStudents,
    recentPlacements,
  };
}

export async function getStudentDetail(userId: string) {
  const [user, profile, applications, interviews, codingResults, resume] = await Promise.all([
    User.findById(userId).select('name email createdAt'),
    Profile.findOne({ userId }),
    Application.find({ userId }).populate('jobId').sort({ updatedAt: -1 }),
    Interview.find({ userId }).sort({ createdAt: -1 }).limit(10),
    CodingResult.find({ userId }).sort({ completedAt: -1 }).limit(5),
    Resume.findOne({ userId, isActive: true }).sort({ createdAt: -1 }),
  ]);

  if (!user || !profile) return null;

  return { user, profile, applications, interviews, codingResults, resume };
}

export async function getColleges(): Promise<string[]> {
  const profiles = await Profile.find({ 'education.collegeName': { $ne: '' } }).select(
    'education.collegeName'
  );
  const colleges = [...new Set(profiles.map((p) => p.education.collegeName).filter(Boolean))];
  return colleges.sort();
}
