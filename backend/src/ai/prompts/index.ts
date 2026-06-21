import { geminiService } from '../gemini.service.js';

export interface ATSAnalysisResult {
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

const ATS_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume analyzer.
Analyze the resume and return a JSON object with:
- atsScore: number 0-100
- missingKeywords: string[] (industry-relevant keywords missing from resume)
- weakSections: string[] (sections that need improvement)
- suggestions: string[] (actionable improvement suggestions)
- extractedSkills: string[]
- extractedEducation: string[]
- extractedProjects: string[] (brief project descriptions)
- extractedExperience: string[] (brief experience entries)
- summary: string (2-3 sentence professional summary)`;

export async function analyzeResume(userId: string, resumeText: string): Promise<ATSAnalysisResult> {
  return geminiService.generateJSON<ATSAnalysisResult>(
    userId,
    'ats_analysis',
    ATS_SYSTEM_PROMPT,
    resumeText
  );
}

export interface JobMatchResult {
  matchPercentage: number;
  missingSkills: string[];
  strengthAreas: string[];
  recommendations: string[];
  reason: string;
}

const JOB_MATCH_PROMPT = `You are a career matching AI. Compare user profile with job description.
Return JSON with:
- matchPercentage: number 0-100
- missingSkills: string[]
- strengthAreas: string[]
- recommendations: string[]
- reason: string (why this job matches or doesn't)`;

export async function analyzeJobMatch(
  userId: string,
  profileData: string,
  jobDescription: string
): Promise<JobMatchResult> {
  return geminiService.generateJSON<JobMatchResult>(
    userId,
    'job_match',
    JOB_MATCH_PROMPT,
    `Profile:\n${profileData}\n\nJob:\n${jobDescription}`
  );
}

export interface GeneratedResume {
  content: string;
  matchScore: number;
  keywordCoverage: string[];
  optimizations: string[];
}

const RESUME_GEN_PROMPT = `You are an expert resume writer. Generate an ATS-optimized resume.
Return JSON with:
- content: string (full resume in structured text format with sections: Summary, Skills, Experience, Projects, Education)
- matchScore: number 0-100
- keywordCoverage: string[] (keywords from job description included)
- optimizations: string[] (list of optimizations made)`;

export async function generateResume(
  userId: string,
  resumeText: string,
  jobDescription: string
): Promise<GeneratedResume> {
  return geminiService.generateJSON<GeneratedResume>(
    userId,
    'resume_generation',
    RESUME_GEN_PROMPT,
    `Current Resume:\n${resumeText}\n\nTarget Job:\n${jobDescription}`
  );
}

export interface CoverLetterResult {
  content: string;
}

const COVER_LETTER_PROMPT = `You are a professional cover letter writer.
Generate a compelling, personalized cover letter.
Return JSON with:
- content: string (full cover letter text, 3-4 paragraphs)`;

export async function generateCoverLetter(
  userId: string,
  profileData: string,
  resumeText: string,
  jobDescription: string,
  companyName: string
): Promise<CoverLetterResult> {
  return geminiService.generateJSON<CoverLetterResult>(
    userId,
    'cover_letter',
    COVER_LETTER_PROMPT,
    `Company: ${companyName}\nProfile:\n${profileData}\nResume:\n${resumeText}\nJob:\n${jobDescription}`
  );
}

export interface InterviewEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  technicalKnowledge: number;
  communication: number;
  confidence: number;
  problemSolving: number;
  clarity: number;
}

const INTERVIEW_EVAL_PROMPT = `You are an expert technical interviewer evaluator.
Evaluate the candidate's answer.
Return JSON with:
- score: number 0-100
- feedback: string
- strengths: string[]
- improvements: string[]
- technicalKnowledge: number 0-100
- communication: number 0-100
- confidence: number 0-100
- problemSolving: number 0-100
- clarity: number 0-100`;

export async function evaluateInterviewAnswer(
  userId: string,
  question: string,
  answer: string,
  domain: string
): Promise<InterviewEvaluation> {
  return geminiService.generateJSON<InterviewEvaluation>(
    userId,
    'interview_evaluation',
    INTERVIEW_EVAL_PROMPT,
    `Domain: ${domain}\nQuestion: ${question}\nAnswer: ${answer}`
  );
}

export async function generateInterviewQuestions(
  userId: string,
  domain: string,
  count: number = 5
): Promise<string[]> {
  const result = await geminiService.generateJSON<{ questions: string[] }>(
    userId,
    'interview_evaluation',
    `Generate ${count} interview questions for ${domain} domain. Return JSON with questions: string[]`,
    `Domain: ${domain}, Count: ${count}`
  );
  return result.questions;
}

export interface SkillGapResult {
  currentSkills: string[];
  requiredSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  recommendations: string[];
}

const SKILL_GAP_PROMPT = `You are a career skills analyst.
Compare current skills with target role requirements.
Return JSON with:
- currentSkills: string[]
- requiredSkills: string[]
- missingSkills: string[]
- matchPercentage: number 0-100
- recommendations: string[]`;

export async function analyzeSkillGap(
  userId: string,
  currentSkills: string[],
  targetRole: string
): Promise<SkillGapResult> {
  return geminiService.generateJSON<SkillGapResult>(
    userId,
    'skill_gap',
    SKILL_GAP_PROMPT,
    `Current Skills: ${currentSkills.join(', ')}\nTarget Role: ${targetRole}`
  );
}

export interface RoadmapResult {
  weeks: Array<{
    week: number;
    title: string;
    topics: string[];
    resources: string[];
    projects: string[];
  }>;
  skillGaps: string[];
}

const ROADMAP_PROMPT = `You are a learning path designer for tech careers.
Create a personalized weekly learning roadmap.
Return JSON with:
- weeks: array of { week: number, title: string, topics: string[], resources: string[], projects: string[] }
- skillGaps: string[]`;

export async function generateRoadmap(
  userId: string,
  targetRole: string,
  currentSkills: string[],
  missingSkills: string[]
): Promise<RoadmapResult> {
  return geminiService.generateJSON<RoadmapResult>(
    userId,
    'roadmap',
    ROADMAP_PROMPT,
    `Target Role: ${targetRole}\nCurrent Skills: ${currentSkills.join(', ')}\nMissing Skills: ${missingSkills.join(', ')}`
  );
}

export interface LinkedInAnalysis {
  profileScore: number;
  headline: { score: number; suggestions: string[] };
  about: { score: number; suggestions: string[] };
  skills: { score: number; suggestions: string[] };
  experience: { score: number; suggestions: string[] };
  projects: { score: number; suggestions: string[] };
  overallSuggestions: string[];
}

const LINKEDIN_PROMPT = `You are a LinkedIn profile optimization expert.
Analyze the LinkedIn profile content provided.
Return JSON with:
- profileScore: number 0-100
- headline: { score: number, suggestions: string[] }
- about: { score: number, suggestions: string[] }
- skills: { score: number, suggestions: string[] }
- experience: { score: number, suggestions: string[] }
- projects: { score: number, suggestions: string[] }
- overallSuggestions: string[]`;

export async function analyzeLinkedIn(
  userId: string,
  profileContent: string
): Promise<LinkedInAnalysis> {
  return geminiService.generateJSON<LinkedInAnalysis>(
    userId,
    'linkedin',
    LINKEDIN_PROMPT,
    profileContent
  );
}

export interface CompanyResearchResult {
  companyName: string;
  overview: string;
  industry: string;
  companySize: string;
  culture: string;
  techStack: string[];
  interviewProcess: string[];
  pros: string[];
  cons: string[];
  preparationTips: string[];
  recentNews: string[];
  fitScore: number;
  fitReason: string;
}

const COMPANY_RESEARCH_PROMPT = `You are a company research analyst helping job seekers prepare for applications and interviews.
Based on the company and job information provided, generate a comprehensive research report.
Return JSON with:
- companyName: string
- overview: string (2-3 sentences about the company)
- industry: string
- companySize: string (estimate if unknown)
- culture: string (work culture description)
- techStack: string[] (technologies commonly used)
- interviewProcess: string[] (typical interview stages)
- pros: string[] (reasons to join)
- cons: string[] (potential concerns)
- preparationTips: string[] (how to prepare for this company)
- recentNews: string[] (relevant industry/company trends, general if specific news unknown)
- fitScore: number 0-100 (how good a fit for the candidate based on profile)
- fitReason: string`;

export async function researchCompany(
  userId: string,
  companyName: string,
  jobDescription: string,
  profileContext: string
): Promise<CompanyResearchResult> {
  return geminiService.generateJSON<CompanyResearchResult>(
    userId,
    'company_research',
    COMPANY_RESEARCH_PROMPT,
    `Company: ${companyName}\nJob Description:\n${jobDescription}\n\nCandidate Profile:\n${profileContext}`
  );
}

export interface SalaryPredictionResult {
  role: string;
  location: string;
  currency: string;
  predictedMin: number;
  predictedMax: number;
  predictedMedian: number;
  marketPercentile: number;
  factors: string[];
  negotiationTips: string[];
  comparisonToProfile: string;
  confidenceLevel: 'low' | 'medium' | 'high';
}

const SALARY_PREDICTION_PROMPT = `You are a compensation analyst specializing in tech salaries for freshers and entry-level roles in India and globally.
Predict salary range based on role, location, skills, and experience level.
Return JSON with:
- role: string
- location: string
- currency: string (INR or USD based on location)
- predictedMin: number (annual)
- predictedMax: number (annual)
- predictedMedian: number (annual)
- marketPercentile: number 0-100 (where candidate likely falls)
- factors: string[] (factors affecting salary)
- negotiationTips: string[] (actionable negotiation advice)
- comparisonToProfile: string (how this compares to candidate expectations)
- confidenceLevel: "low" | "medium" | "high"`;

export async function predictSalary(
  userId: string,
  role: string,
  location: string,
  experience: string,
  skills: string[],
  expectedSalary?: { min: number; max: number; currency: string }
): Promise<SalaryPredictionResult> {
  const expected = expectedSalary
    ? `Expected: ${expectedSalary.min}-${expectedSalary.max} ${expectedSalary.currency}`
    : 'No salary expectation set';

  return geminiService.generateJSON<SalaryPredictionResult>(
    userId,
    'salary_prediction',
    SALARY_PREDICTION_PROMPT,
    `Role: ${role}\nLocation: ${location}\nExperience: ${experience}\nSkills: ${skills.join(', ')}\n${expected}`
  );
}

export interface AutoApplyChecklist {
  readinessScore: number;
  checklist: Array<{ item: string; status: 'ready' | 'pending' | 'missing'; action: string }>;
  recommendedSteps: string[];
  estimatedTimeMinutes: number;
  summary: string;
}

const AUTO_APPLY_PROMPT = `You are an application preparation assistant. Create a readiness checklist for applying to a job.
Do NOT actually apply to jobs. Only prepare the candidate.
Return JSON with:
- readinessScore: number 0-100
- checklist: array of { item: string, status: "ready"|"pending"|"missing", action: string }
- recommendedSteps: string[] (ordered steps before applying)
- estimatedTimeMinutes: number
- summary: string`;

export async function generateAutoApplyChecklist(
  userId: string,
  jobDescription: string,
  profileContext: string,
  hasResume: boolean,
  hasCoverLetter: boolean,
  atsScore: number,
  matchScore: number
): Promise<AutoApplyChecklist> {
  return geminiService.generateJSON<AutoApplyChecklist>(
    userId,
    'auto_apply',
    AUTO_APPLY_PROMPT,
    `Job:\n${jobDescription}\n\nProfile:\n${profileContext}\nHas Resume: ${hasResume}\nHas Cover Letter: ${hasCoverLetter}\nATS Score: ${atsScore}\nMatch Score: ${matchScore}`
  );
}

export interface VideoInterviewAnalysis {
  overallScore: number;
  communication: number;
  confidence: number;
  clarity: number;
  structure: number;
  fillerWordCount: number;
  fillerWords: string[];
  wordsPerMinute: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

const VIDEO_INTERVIEW_PROMPT = `You are an expert interview coach analyzing a video interview transcript.
Analyze speech patterns, content quality, and delivery based on the transcript.
Return JSON with:
- overallScore: number 0-100
- communication: number 0-100
- confidence: number 0-100
- clarity: number 0-100
- structure: number 0-100 (answer organization)
- fillerWordCount: number
- fillerWords: string[] (detected filler words like um, uh, like, you know)
- wordsPerMinute: number (estimate from transcript and duration)
- strengths: string[]
- improvements: string[]
- feedback: string (detailed paragraph)`;

export async function analyzeVideoInterview(
  userId: string,
  transcript: string,
  domain: string,
  durationSeconds: number
): Promise<VideoInterviewAnalysis> {
  return geminiService.generateJSON<VideoInterviewAnalysis>(
    userId,
    'video_interview',
    VIDEO_INTERVIEW_PROMPT,
    `Domain: ${domain}\nDuration: ${durationSeconds} seconds\nTranscript:\n${transcript}`
  );
}
