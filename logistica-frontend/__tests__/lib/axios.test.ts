import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import api from '@/lib/api';

const BASE = 'http://127.0.0.1:8000/api/v1';

function setLocalAuth(accessToken: string | null, refreshToken: string | null) {
  localStorage.setItem(
    'logistica-auth',
    JSON.stringify({
      state: { accessToken, refreshToken, user: null, permissions: [] },
      version: 0,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('location', { href: 'http://localhost:3000/' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Request interceptor ──────────────────────────────────────────────────────

describe('request interceptor', () => {
  it('adds Authorization header when token in localStorage', async () => {
    setLocalAuth('my-access-token', 'my-refresh-token');

    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ results: [], count: 0, next: null, previous: null });
      }),
    );

    await api.get('/customers/');
    expect(capturedAuth).toBe('Bearer my-access-token');
  });

  it('does NOT add Authorization header when localStorage is empty', async () => {
    let capturedAuth: string | null = 'something';
    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ results: [], count: 0, next: null, previous: null });
      }),
    );

    await api.get('/customers/');
    expect(capturedAuth).toBeNull();
  });

  it('does NOT add header when accessToken is null', async () => {
    setLocalAuth(null, null);

    let capturedAuth: string | null = 'something';
    server.use(
      http.get(`${BASE}/customers/`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ results: [], count: 0, next: null, previous: null });
      }),
    );

    // localStorage has the key but token value is null
    await api.get('/customers/');
    expect(capturedAuth).toBeNull();
  });
});

// ─── Response interceptor — 401 handling ──────────────────────────────────────

describe('response interceptor — 401 with valid refresh token', () => {
  it('refreshes token, patches localStorage, and retries original request', async () => {
    setLocalAuth('old-access', 'valid-refresh');

    let callCount = 0;
    server.use(
      http.get(`${BASE}/customers/`, () => {
        callCount++;
        if (callCount === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ results: [{ id: 1 }], count: 1, next: null, previous: null });
      }),
      http.post(`${BASE}/auth/token/refresh/`, () =>
        HttpResponse.json({ access: 'new-access-token' }),
      ),
    );

    const res = await api.get('/customers/');
    expect(res.status).toBe(200);
    expect(callCount).toBe(2);

    const stored = JSON.parse(localStorage.getItem('logistica-auth') || '{}');
    expect(stored.state.accessToken).toBe('new-access-token');
  });
});

describe('response interceptor — 401 with no refresh token', () => {
  it('clears localStorage and redirects to /login then rejects', async () => {
    // Put a token in localStorage but no refresh
    localStorage.setItem(
      'logistica-auth',
      JSON.stringify({
        state: { accessToken: 'old', refreshToken: null, user: null, permissions: [] },
        version: 0,
      }),
    );

    server.use(
      http.get(`${BASE}/customers/`, () => new HttpResponse(null, { status: 401 })),
    );

    await expect(api.get('/customers/')).rejects.toBeDefined();
    expect(localStorage.getItem('logistica-auth')).toBeNull();
    expect((window.location as { href: string }).href).toBe('/login');
  });
});

describe('response interceptor — 401 when refresh call fails', () => {
  it('clears localStorage and redirects then rejects', async () => {
    setLocalAuth('old-access', 'bad-refresh');

    server.use(
      http.get(`${BASE}/customers/`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/token/refresh/`, () => new HttpResponse(null, { status: 401 })),
    );

    await expect(api.get('/customers/')).rejects.toBeDefined();
    expect(localStorage.getItem('logistica-auth')).toBeNull();
    expect((window.location as { href: string }).href).toBe('/login');
  });
});

describe('response interceptor — _retry flag prevents infinite loop', () => {
  it('calls refresh endpoint exactly once even when retry also gets 401', async () => {
    setLocalAuth('old-access', 'valid-refresh');

    let refreshCallCount = 0;
    server.use(
      // Always 401 — even after retry
      http.get(`${BASE}/customers/`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/token/refresh/`, () => {
        refreshCallCount++;
        return HttpResponse.json({ access: 'new-token' });
      }),
    );

    await expect(api.get('/customers/')).rejects.toBeDefined();
    // Refresh called exactly once — _retry flag blocked second attempt
    expect(refreshCallCount).toBe(1);
  });
});
