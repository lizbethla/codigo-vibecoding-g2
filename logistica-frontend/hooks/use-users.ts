'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  AppUser,
  AppUserCreate,
  AppUserUpdate,
  Group,
  GroupCreate,
  GroupUpdate,
  Permission,
  PaginatedResponse,
  UserProfile,
} from '@/docs/schemas';

// ─── Profile ─────────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ['auth-me'],
    queryFn: () => api.get<UserProfile>('/auth/me/').then((r) => r.data),
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery<PaginatedResponse<AppUser>>({
    queryKey: ['auth-users'],
    queryFn: () => api.get<PaginatedResponse<AppUser>>('/auth/users/').then((r) => r.data),
  });
}

export function useUser(id: number) {
  return useQuery<AppUser>({
    queryKey: ['auth-users', id],
    queryFn: () => api.get<AppUser>(`/auth/users/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation<AppUser, Error, AppUserCreate>({
    mutationFn: (data) => api.post<AppUser>('/auth/users/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth-users'] }),
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation<AppUser, Error, AppUserUpdate>({
    mutationFn: (data) => api.patch<AppUser>(`/auth/users/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-users'] });
      qc.invalidateQueries({ queryKey: ['auth-users', id] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(`/auth/users/${id}/`).then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth-users'] }),
  });
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export function useGroups() {
  return useQuery<PaginatedResponse<Group>>({
    queryKey: ['auth-groups'],
    queryFn: () =>
      api.get<PaginatedResponse<Group>>('/auth/groups/?page_size=100').then((r) => r.data),
  });
}

export function useGroup(id: number) {
  return useQuery<Group>({
    queryKey: ['auth-groups', id],
    queryFn: () => api.get<Group>(`/auth/groups/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation<Group, Error, GroupCreate>({
    mutationFn: (data) => api.post<Group>('/auth/groups/', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth-groups'] }),
  });
}

export function useUpdateGroup(id: number) {
  const qc = useQueryClient();
  return useMutation<Group, Error, GroupUpdate>({
    mutationFn: (data) => api.patch<Group>(`/auth/groups/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-groups'] });
      qc.invalidateQueries({ queryKey: ['auth-groups', id] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(`/auth/groups/${id}/`).then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth-groups'] }),
  });
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export function usePermissions() {
  return useQuery<Permission[]>({
    queryKey: ['auth-permissions'],
    queryFn: () => api.get<Permission[]>('/auth/permissions/').then((r) => r.data),
    staleTime: 10 * 60 * 1000, // permissions rarely change
  });
}
