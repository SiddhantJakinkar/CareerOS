import { api } from './api';
import type {
  ApiResponse,
  AuthResponse,
  User,
  Profile,
  Job,
  Resume,
  Application,
  Interview,
  CodingTest,
  DashboardData,
} from '@/types';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  google: (credential: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/google', { credential }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<ApiResponse<{ user: User; profile: Profile }>>('/auth/me'),
};

export const profileApi = {
  get: () => api.get<ApiResponse<Profile>>('/profile'),
  update: (data: Partial<Profile>) => api.put<ApiResponse<Profile>>('/profile', data),
  completeOnboarding: (data: Partial<Profile> & { name?: string }) =>
    api.post<ApiResponse<Profile>>('/profile/onboarding', data),
};

export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post<ApiResponse<Resume>>('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyze: () => api.post<ApiResponse<{ resume: Resume; analysis: Resume['analysis'] }>>('/resume/analyze'),
  getReport: () => api.get<ApiResponse<Resume>>('/resume/report'),
  getAll: () => api.get<ApiResponse<Resume[]>>('/resume'),
  generate: (jobId: string) => api.post('/resume/generate', { jobId }),
};

export const jobApi = {
  search: (params: Record<string, string | number | boolean>) =>
    api.get<ApiResponse<{ jobs: Job[]; total: number; fetchedFromNetwork?: { remotive: number; arbeitnow: number; jsearch: number; remoteok: number; adzuna: number; skipped?: boolean } }>>('/jobs', { params }),
  syncStatus: () =>
    api.get<ApiResponse<{
      lastSync: { startedAt: string; completedAt?: string; status: string; stats: { totalUpserted: number } } | null;
      totalJobs: number;
      publisherCounts: Array<{ publisher: string; count: number }>;
      syncIntervalMinutes: number;
      sources: string[];
    }>>('/jobs/sync/status'),
  syncFromNetwork: (data?: { search?: string; location?: string; jobType?: string; forceFetch?: boolean }) =>
    api.post<ApiResponse<{ remotive: number; arbeitnow: number; jsearch: number; remoteok: number; adzuna: number; skipped?: boolean }>>('/jobs/sync', data ?? {}),
  getById: (id: string) => api.get<ApiResponse<{ job: Job; matchAnalysis: unknown }>>(`/jobs/${id}`),
  getMatch: (id: string) => api.get(`/jobs/${id}/match`),
  recommended: () => api.get<ApiResponse<Job[]>>('/jobs/recommended'),
  trending: () => api.get<ApiResponse<Job[]>>('/jobs/trending'),
  latest: () => api.get<ApiResponse<Job[]>>('/jobs/latest'),
  save: (id: string) => api.post(`/jobs/${id}/save`),
  unsave: (id: string) => api.delete(`/jobs/${id}/save`),
  saved: () => api.get('/jobs/saved'),
};

export const applicationApi = {
  getAll: () => api.get<ApiResponse<Application[]>>('/applications'),
  create: (data: { jobId: string; status?: string; notes?: string }) =>
    api.post<ApiResponse<Application>>('/applications', data),
  update: (id: string, data: { status?: string; notes?: string }) =>
    api.patch<ApiResponse<Application>>(`/applications/${id}`, data),
  generateCoverLetter: (jobId: string) =>
    api.post('/applications/cover-letter', { jobId }),
  getCoverLetter: (jobId: string) => api.get(`/applications/cover-letter/${jobId}`),
};

export const interviewApi = {
  getDomains: () =>
    api.get<ApiResponse<{
      domains: Array<{ id: string; label: string; description: string }>;
      recommended: string;
      reason: string;
      targetRole: string | null;
      academicStream?: string;
      defaultTargetRole?: string;
    }>>('/interview/domains'),
  getAll: () => api.get<ApiResponse<Interview[]>>('/interview'),
  start: (domain: string, type: 'mock' | 'voice' | 'video' = 'mock') =>
    api.post('/interview/start', { domain, type }),
  answer: (interviewId: string, answer: string) =>
    api.post('/interview/answer', { interviewId, answer }),
  submitVideoAnswer: (interviewId: string, video: Blob, durationSeconds: number) => {
    const form = new FormData();
    form.append('video', video, `answer-${Date.now()}.webm`);
    form.append('interviewId', interviewId);
    form.append('durationSeconds', String(durationSeconds));
    return api.post('/interview/video-answer', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getReport: (id: string) => api.get(`/interview/report/${id}`),
  startLive: (data: {
    domain?: string;
    inviteToken?: string;
    jobId?: string;
    jobTitle?: string;
    companyName?: string;
  }) => api.post('/interview/live/start', data),
  liveTurn: (
    interviewId: string,
    opts: {
      transcript?: string;
      skipped?: boolean;
      silenceTimeout?: boolean;
      afterRetry?: boolean;
      durationSeconds?: number;
      audio?: Blob;
    }
  ) => {
    const form = new FormData();
    form.append('interviewId', interviewId);
    if (opts.transcript) form.append('transcript', opts.transcript);
    if (opts.skipped) form.append('skipped', 'true');
    if (opts.silenceTimeout) form.append('silenceTimeout', 'true');
    if (opts.afterRetry) form.append('afterRetry', 'true');
    if (opts.durationSeconds != null) form.append('durationSeconds', String(opts.durationSeconds));
    if (opts.audio) form.append('audio', opts.audio, 'answer.webm');
    return api.post('/interview/live/turn', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getInvitePublic: (token: string) => api.get(`/interview/invites/public/${token}`),
  createInvite: (data: {
    domain: string;
    companyName: string;
    jobTitle: string;
    targetRole?: string;
    expiresInDays?: number;
    maxQuestions?: number;
  }) => api.post('/interview/invites', data),
  listInvites: () => api.get('/interview/invites'),
};

export const voiceApi = {
  transcribe: (audio: Blob) => {
    const form = new FormData();
    form.append('audio', audio, 'recording.webm');
    return api.post('/voice/transcribe', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  evaluate: (interviewId: string, audio?: Blob, transcript?: string) => {
    const form = new FormData();
    form.append('interviewId', interviewId);
    if (audio) form.append('audio', audio, 'recording.webm');
    if (transcript) form.append('transcript', transcript);
    return api.post('/voice/evaluate', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const codingApi = {
  getTests: (category?: string) =>
    api.get<ApiResponse<CodingTest[]>>('/tests', { params: category ? { category } : {} }),
  getTest: (id: string) => api.get<ApiResponse<CodingTest>>(`/tests/${id}`),
  submit: (data: { testId: string; answers: Array<{ questionId: string; answer: string; timeSpent: number }>; timeTaken: number }) =>
    api.post('/tests/submit', data),
  getResults: () => api.get('/tests/results/all'),
};

export const skillsApi = {
  getGap: (targetRole?: string) =>
    api.get('/skills/gap', { params: targetRole ? { targetRole } : {} }),
  generateRoadmap: (targetRole: string) => api.post('/skills/roadmap', { targetRole }),
  getRoadmaps: () => api.get('/skills/roadmap'),
  updateRoadmap: (id: string, weekIndex: number, completed: boolean) =>
    api.patch(`/skills/roadmap/${id}`, { weekIndex, completed }),
};

export const linkedinApi = {
  analyze: (data: { linkedinUrl: string; profileContent: string }) =>
    api.post('/linkedin/analyze', data),
};

export const dashboardApi = {
  get: () => api.get<ApiResponse<DashboardData>>('/dashboard'),
  getReports: () => api.get('/dashboard/reports'),
  getAnalytics: () => api.get('/dashboard/analytics'),
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const chatApi = {
  getConversations: () => api.get<ApiResponse<import('@/types').ChatConversation[]>>('/chat'),
  getConversation: (id: string) => api.get<ApiResponse<import('@/types').ChatConversation>>(`/chat/${id}`),
  sendMessage: (message: string, chatId?: string) =>
    api.post<ApiResponse<{ chat: import('@/types').ChatConversation; reply: string }>>('/chat', {
      message,
      chatId,
    }),
  deleteConversation: (id: string) => api.delete(`/chat/${id}`),
};

export const insightsApi = {
  researchCompany: (jobId: string) => api.post('/insights/company-research', { jobId }),
  getCompanyResearch: (jobId: string) => api.get(`/insights/company-research/${jobId}`),
  predictSalary: (data: { jobId?: string; role?: string; location?: string }) =>
    api.post('/insights/salary-prediction', data),
  getSalaryPrediction: (jobId?: string) =>
    api.get('/insights/salary-prediction', { params: jobId ? { jobId } : {} }),
  prepareAutoApply: (jobId: string) => api.post(`/insights/auto-apply/${jobId}`),
};

export const placementApi = {
  getOverview: (college?: string) =>
    api.get('/placement/overview', { params: college ? { college } : {} }),
  getColleges: () => api.get('/placement/colleges'),
  getStudent: (userId: string) => api.get(`/placement/students/${userId}`),
};

export const videoInterviewApi = {
  getAll: () => api.get('/video-interview'),
  getById: (id: string) => api.get(`/video-interview/${id}`),
  upload: (form: FormData) =>
    api.post('/video-interview', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/video-interview/${id}`),
};
