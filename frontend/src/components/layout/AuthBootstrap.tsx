import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { refreshSession } from '@/services/api';
import { PageSkeleton } from '@/components/ui/skeleton';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(!isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const token = await refreshSession();
      if (!token) {
        useAuthStore.getState().logout();
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!ready) return <PageSkeleton />;
  return <>{children}</>;
}
