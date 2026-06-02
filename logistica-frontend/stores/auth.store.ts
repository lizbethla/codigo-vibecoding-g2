import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  username: string;
  email?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      setUser: (user) => set({ user }),

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'logistica-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
