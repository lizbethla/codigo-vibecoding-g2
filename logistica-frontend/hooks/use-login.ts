'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { TokenPair, LoginCredentials, UserProfile } from '@/docs/schemas';

export function useLogin() {
  const router = useRouter();

  return useMutation<TokenPair, AxiosError, LoginCredentials>({
    mutationFn: (credentials) =>
      api.post<TokenPair>('/auth/token/', credentials).then((r) => r.data),

    onSuccess: async (data) => {
      useAuthStore.getState().setTokens(data.access, data.refresh);
      useAuthStore.getState().setUser({
        username: data.username,
        email: data.email,
        is_superuser: data.is_superuser,
        is_staff: data.is_staff,
        user_id: data.user_id,
      });

      try {
        const profile = await api.get<UserProfile>('/auth/me/');
        const codenames = profile.data.groups.flatMap(
          (g) => (g.permissions ?? []).map((p) => p.codename),
        );
        useAuthStore.getState().setPermissions(codenames);
      } catch {
        // fail silently — superusers bypass permission checks anyway
      }

      router.push('/dashboard');
    },
  });
}
