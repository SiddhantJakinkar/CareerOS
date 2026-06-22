export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type AcademicStreamId =
  | 'engineering'
  | 'commerce'
  | 'management'
  | 'arts'
  | 'science'
  | 'law'
  | 'healthcare'
  | 'other';

export interface Profile {
  _id: string;
  userId: string;
  academicStream?: AcademicStreamId;
  phone?: string;
  location?: string;
  education: {
    collegeName: string;
    degree: string;
    branch: string;
    currentYear?: number;
    graduationYear: number;
    cgpa?: number;
  };
  careerPreferences: {
    targetRole: string;
    preferredLocations: string[];
    jobType: string;
    workMode: string;
    expectedSalary?: { min: number; max: number; currency: string };
  };
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    certifications: string[];
  };
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  placementReadinessScore: number;
  atsScore: number;
  codingScore: number;
  interviewScore: number;
  jobMatchScore: number;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
  location: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  experience: string;
  jobType: string;
  workMode: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  applyUrl?: string;
  source?: string;
  publisher?: string;
  deadline?: string;
  postedAt: string;
  matchScore?: {
    totalScore: number;
    missingSkills: string[];
    reason: string;
    skillsMatch: number;
  };
}

export interface ResumeAnalysis {
  atsScore: number;
  missingKeywords: string[];
  weakSections: string[];
  suggestions: string[];
  extractedSkills: string[];
  extractedEducation: string[];
  extractedProjects: string[];
  extractedExperience: string[];
  summary: string;
}

export interface Resume {
  _id: string;
  fileName: string;
  fileUrl: string;
  rawText: string;
  analysis: ResumeAnalysis;
  isActive: boolean;
  createdAt: string;
}

export interface Application {
  _id: string;
  jobId: Job;
  status: string;
  notes: string;
  timeline: Array<{ status: string; note?: string; date: string }>;
  appliedAt?: string;
  updatedAt: string;
}

export interface Interview {
  _id: string;
  type: string;
  domain: string;
  status: string;
  questions: string[];
  currentQuestionIndex: number;
  overallScore: number;
  metrics: Record<string, number>;
  feedback: string;
  suggestions: string[];
  strengths?: string[];
  focusAreas?: string[];
  createdAt: string;
}

export interface CodingTest {
  _id: string;
  category: string;
  title: string;
  description: string;
  duration: number;
  totalPoints: number;
  questions: Array<{
    id: string;
    type: string;
    question: string;
    options?: string[];
    topic: string;
    difficulty: string;
    points: number;
  }>;
}

export interface DashboardData {
  placementReadiness: number;
  scores: { ats: number; coding: number; interview: number; jobMatch: number };
  resume: { atsScore: number; status: string; topSkills: string[] };
  recommendedJobs: Job[];
  skillGaps: string[];
  codingProgress: unknown[];
  interviewProgress: Interview[];
  applications: Application[];
  applicationStats: {
    total: number;
    applied: number;
    interviews: number;
    selected: number;
    rejected: number;
  };
  recentActivities: Array<{ action: string; entity: string; createdAt: string }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatConversation {
  _id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
