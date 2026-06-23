import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { refreshSession } from '@/services/api';
import { getAccessToken } from '@/services/tokenMemory';
import { PageSkeleton } from '@/components/ui/skeleton';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isAuthenticated) {
        if (!cancelled) setReady(true);
        return;
      }

      // Fresh login/register already returned an access token — do not refresh immediately.
      if (getAccessToken()) {
        if (!cancelled) setReady(true);
        return;
      }

      // Page reload: restore session from httpOnly refresh cookie (when cross-origin cookies work).
      const token = await refreshSession();
      if (!token && !cancelled) {
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
