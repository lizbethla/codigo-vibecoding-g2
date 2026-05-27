import axios from 'axios';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/Task';
import type { AuthUser } from '../lib/auth';
import { getToken } from '../lib/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const taskApi = {
  getAll: () => api.get<Task[]>('/tasks').then((res) => res.data),

  getById: (id: string) => api.get<Task>(`/tasks/${id}`).then((res) => res.data),

  create: (data: CreateTaskInput) => api.post<Task>('/tasks', data).then((res) => res.data),

  update: (id: string, data: UpdateTaskInput) =>
    api.put<Task>(`/tasks/${id}`, data).then((res) => res.data),

  delete: (id: string) => api.delete(`/tasks/${id}`).then(() => void 0),
};

interface LoginResponse {
  user: AuthUser;
  token: string;
}

interface RegisterInput {
  name: string;
  lastname: string;
  email: string;
  password: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/users/login', { email, password }).then((res) => res.data),

  register: (data: RegisterInput) =>
    api.post<{ user: AuthUser }>('/users/register', data).then((res) => res.data),

  logout: () => api.post('/users/logout').then(() => void 0),
};
