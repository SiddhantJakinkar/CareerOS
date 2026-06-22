import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, AuthRoute, OnboardingRoute } from '@/components/layout/ProtectedRoute';
import { AuthBootstrap } from '@/components/layout/AuthBootstrap';
import { CounselorRoute } from '@/components/layout/CounselorRoute';
import { PageSkeleton } from '@/components/ui/skeleton';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const JobSearchPage = lazy(() => import('@/pages/jobs/JobSearchPage'));
const JobDetailsPage = lazy(() => import('@/pages/jobs/JobDetailsPage'));
const ResumeAnalyzerPage = lazy(() => import('@/pages/resume/ResumeAnalyzerPage'));
const AIInterviewPage = lazy(() => import('@/pages/interview/AIInterviewPage'));
const JoinInterviewPage = lazy(() => import('@/pages/interview/JoinInterviewPage'));
const CodingAssessmentPage = lazy(() => import('@/pages/coding/CodingAssessmentPage'));
const SkillGapPage = lazy(() => import('@/pages/skills/SkillGapPage'));
const RoadmapPage = lazy(() => import('@/pages/skills/RoadmapPage'));
const LinkedInAnalyzerPage = lazy(() => import('@/pages/linkedin/LinkedInAnalyzerPage'));
const ApplicationsPage = lazy(() => import('@/pages/applications/ApplicationsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const CareerChatPage = lazy(() => import('@/pages/chat/CareerChatPage'));
const PlacementCellPage = lazy(() => import('@/pages/placement/PlacementCellPage'));
const PlacementStudentPage = lazy(() => import('@/pages/placement/PlacementStudentPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        // Never retry 401/403/404 — retrying auth errors causes request bursts
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
        <Routes>
          <Route path="/verify-email" element={<LazyPage><VerifyEmailPage /></LazyPage>} />
          <Route element={<AuthRoute />}>
            <Route path="/login" element={<LazyPage><LoginPage /></LazyPage>} />
            <Route path="/register" element={<LazyPage><RegisterPage /></LazyPage>} />
          </Route>

          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding" element={<LazyPage><OnboardingPage /></LazyPage>} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<LazyPage><DashboardPage /></LazyPage>} />
              <Route path="/career-chat" element={<LazyPage><CareerChatPage /></LazyPage>} />
              <Route path="/jobs" element={<LazyPage><JobSearchPage /></LazyPage>} />
              <Route path="/jobs/:id" element={<LazyPage><JobDetailsPage /></LazyPage>} />
              <Route path="/resume-analyzer" element={<LazyPage><ResumeAnalyzerPage /></LazyPage>} />
              <Route path="/ai-interview" element={<LazyPage><AIInterviewPage /></LazyPage>} />
              <Route path="/interview/join/:token" element={<LazyPage><JoinInterviewPage /></LazyPage>} />
              <Route path="/voice-interview" element={<Navigate to="/ai-interview?mode=voice" replace />} />
              <Route path="/video-interview" element={<Navigate to="/ai-interview?mode=video" replace />} />
              <Route path="/coding" element={<LazyPage><CodingAssessmentPage /></LazyPage>} />
              <Route path="/coding/:id" element={<LazyPage><CodingAssessmentPage /></LazyPage>} />
              <Route path="/skill-gap" element={<LazyPage><SkillGapPage /></LazyPage>} />
              <Route path="/roadmap" element={<LazyPage><RoadmapPage /></LazyPage>} />
              <Route path="/linkedin" element={<LazyPage><LinkedInAnalyzerPage /></LazyPage>} />
              <Route path="/applications" element={<LazyPage><ApplicationsPage /></LazyPage>} />
              <Route path="/reports" element={<LazyPage><ReportsPage /></LazyPage>} />
              <Route path="/profile" element={<LazyPage><ProfilePage /></LazyPage>} />
              <Route path="/notifications" element={<LazyPage><NotificationsPage /></LazyPage>} />
            </Route>

            <Route element={<CounselorRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/placement-cell" element={<LazyPage><PlacementCellPage /></LazyPage>} />
                <Route path="/placement-cell/students/:userId" element={<LazyPage><PlacementStudentPage /></LazyPage>} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<LazyPage><LandingPage /></LazyPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthBootstrap>
      </BrowserRouter>
      <Toaster theme="dark" position="top-right" richColors />
    </QueryClientProvider>
  );
}
