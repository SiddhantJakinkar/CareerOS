import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/services/endpoints';
import { useAuthStore } from '@/store';

/** Loads profile once for authenticated layout (stream-aware nav and defaults). */
export function useProfileBootstrap() {
  const setProfile = useAuthStore((s) => s.setProfile);
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await profileApi.get()).data.data,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (data) setProfile(data);
  }, [data, setProfile]);

  return profile ?? data ?? null;
}
