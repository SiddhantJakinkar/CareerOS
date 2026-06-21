import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';

export function ProtectedRoute() {
  const { isAuthenticated, user, logout } = useAuthStore();

  // Zustand may persist isAuthenticated:true but tokens can be missing (e.g. after
  // a password change, backend restart, or partial localStorage clear). Force logout.
  const hasToken = Boolean(localStorage.getItem('accessToken'));
  if (isAuthenticated && !hasToken) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function AuthRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated && !user?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function OnboardingRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
