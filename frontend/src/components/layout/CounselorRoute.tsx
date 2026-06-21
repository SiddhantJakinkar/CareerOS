import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';

export function CounselorRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !['admin', 'counselor'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
