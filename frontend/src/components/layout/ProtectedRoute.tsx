import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { getAccessToken } from '@/services/tokenMemory';

export function ProtectedRoute() {
  const { isAuthenticated, user, logout } = useAuthStore();

  const hasToken = Boolean(getAccessToken());
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
