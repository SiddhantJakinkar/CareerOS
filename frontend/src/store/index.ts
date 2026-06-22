import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Profile } from '@/types';
import { clearTokens, setAccessToken, setCsrfToken } from '@/services/tokenMemory';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, csrfToken?: string) => void;
  setProfile: (profile: Profile) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, csrfToken) => {
        setAccessToken(accessToken);
        if (csrfToken) setCsrfToken(csrfToken);
        set({ user, isAuthenticated: true });
      },
      setProfile: (profile) => set({ profile }),
      setUser: (user) => set({ user }),
      logout: () => {
        clearTokens();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, profile: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
