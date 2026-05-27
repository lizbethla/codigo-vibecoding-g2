export interface AuthUser {
  id: string;
  name: string;
  lastname: string;
  email: string;
}

const TOKEN_KEY = 'tm_token';
const USER_KEY = 'tm_user';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};

export const setAuth = (user: AuthUser, token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
