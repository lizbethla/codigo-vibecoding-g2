'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { TokenPair, LoginCredentials } from '@/docs/schemas';

export function useLogin() {
  const router = useRouter();

  return useMutation<TokenPair, AxiosError, LoginCredentials>({
    mutationFn: (credentials) =>
      api.post<TokenPair>('/auth/token/', credentials).then((r) => r.data),

    onSuccess: (data, variables) => {
      useAuthStore.getState().setTokens(data.access, data.refresh);
      useAuthStore.getState().setUser({ username: variables.username });
      router.push('/');
    },
  });
}
