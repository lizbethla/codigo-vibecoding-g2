import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  username: string;
  email?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  user_id?: number;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  permissions: string[];
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  setPermissions: (permissions: string[]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isSuperAdmin: () => boolean;
  hasPermission: (codename: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: [],

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      setUser: (user) => set({ user }),

      setPermissions: (permissions) => set({ permissions }),

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null, permissions: [] });
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      isAuthenticated: () => !!get().accessToken,
      isSuperAdmin: () => !!get().user?.is_superuser,
      hasPermission: (codename) => {
        const { user, permissions } = get();
        if (user?.is_superuser) return true;
        return permissions.includes(codename);
      },
    }),
    {
      name: 'logistica-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        permissions: state.permissions,
      }),
    },
  ),
);
