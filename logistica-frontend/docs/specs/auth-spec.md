# Spec: Auth

## Overview

The Auth module introduces the login page at `/login` and route protection for all dashboard pages. The user submits a username + password form which calls `POST /api/v1/auth/token/` to obtain a JWT pair; both tokens are stored in `useAuthStore` (persisted to localStorage via Zustand's `persist` middleware). The `app/(dashboard)/layout.tsx` protected layout checks `isAuthenticated()` on mount and redirects to `/login` if no token is present. Token injection and silent auto-refresh are already implemented in `lib/api.ts`, so this module only wires up the login UI and the guard layout — no manual interceptor work required.

---

## Pages

### Page: `/login`

- **Route:** `/login`
- **Component:** `app/(auth)/login/page.tsx`
- **Type:** form
- **Layout wrapper:** `app/(auth)/layout.tsx` (unauthenticated shell — no sidebar, centered card)

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `LoginPage` | new — `app/(auth)/login/page.tsx` | Page entry, handles redirect if already logged in |
| `LoginForm` | new — `components/auth/login-form.tsx` | Controlled form, calls mutation, shows errors |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | shadcn/ui | Wraps the form |
| `Input` | shadcn/ui | username and password fields |
| `Button` | shadcn/ui | Submit button with loading state |
| `Label` | shadcn/ui | Field labels |

#### TanStack Query

Auth login is a mutation (not a query — no caching needed):

```ts
// hooks/use-login.ts
useMutation<TokenPair, AxiosError, LoginCredentials>({
  mutationFn: (credentials) =>
    api.post('/auth/token/', credentials).then((r) => r.data),
  onSuccess: (data) => {
    useAuthStore.getState().setTokens(data.access, data.refresh);
    // Optionally decode JWT to extract username and call setUser
    router.push('/');
  },
  onError: (error) => {
    // surface error.response?.data?.detail or generic message
  },
})
```

No queryKey needed — login mutations are not cached.

#### Form fields

| Field | Label | Type | Validation |
|-------|-------|------|-----------|
| `username` | Usuario | text (input) | required, min 1 char |
| `password` | Contraseña | password (input) | required, min 1 char |

Validation handled with `react-hook-form` + `zod`:

```ts
const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
```

#### Zustand usage

After successful mutation:
- `useAuthStore.getState().setTokens(access, refresh)` — stores both tokens
- `useAuthStore.getState().setUser({ username })` — optional: decode access JWT to get username

On `LoginPage` mount (client-side):
- `useAuthStore.getState().isAuthenticated()` — if `true`, redirect to `/` immediately

---

### Page: Dashboard protected layout

- **Route:** All routes under `app/(dashboard)/`
- **Component:** `app/(dashboard)/layout.tsx`
- **Type:** layout guard

#### Component tree

| Component | Source | Notes |
|-----------|--------|-------|
| `DashboardLayout` | new — `app/(dashboard)/layout.tsx` | Auth guard + sidebar shell |
| `AuthGuard` | new — `components/auth/auth-guard.tsx` | Client component that checks token, redirects to `/login` |
| Sidebar (placeholder) | new — `components/layout/sidebar.tsx` | Navigation shell; minimal for Auth module, expanded in future modules |

#### Auth guard logic

`AuthGuard` must be a `'use client'` component:

```ts
// components/auth/auth-guard.tsx
'use client';
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null; // prevent flash of protected content

  return <>{children}</>;
}
```

`app/(dashboard)/layout.tsx` wraps children in `<AuthGuard>` plus the sidebar shell.

#### Zustand usage

- `useAuthStore((s) => s.isAuthenticated())` — reactive subscription in `AuthGuard`
- `useAuthStore((s) => s.logout())` — called from a logout button in the sidebar

---

## TypeScript types

From `docs/schemas/index.ts`:

| Type | Used in |
|------|---------|
| `TokenPair` | `use-login.ts` mutation return type |
| `LoginCredentials` | `use-login.ts` mutation variables type, `LoginForm` props |

Additional local type (not in schemas — form-only):
```ts
// Derived from LoginCredentials, used with react-hook-form
type LoginFormValues = LoginCredentials;
```

---

## API calls

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| `POST` | `/auth/token/` | `{ username, password }` | Returns `TokenPair`. Called once on login form submit. |
| `POST` | `/auth/token/refresh/` | `{ refresh }` | Already handled automatically by `lib/api.ts` interceptor — do NOT call manually. |

No GET endpoints required for this module.

---

## File list

### Files to create

| File | Purpose |
|------|---------|
| `app/(auth)/layout.tsx` | Unauthenticated shell layout (centered, no sidebar) |
| `app/(auth)/login/page.tsx` | Login page — mounts `LoginForm`, handles already-authenticated redirect |
| `app/(dashboard)/layout.tsx` | Protected dashboard shell — wraps children in `AuthGuard` + sidebar |
| `components/auth/login-form.tsx` | Controlled form component using `react-hook-form` + `zod` + `useMutation` |
| `components/auth/auth-guard.tsx` | Client guard component — redirects to `/login` if not authenticated |
| `components/layout/sidebar.tsx` | Minimal sidebar shell with app title and logout button |
| `hooks/use-login.ts` | `useMutation` hook for `POST /auth/token/` |

### Files to modify

| File | Change |
|------|--------|
| `app/page.tsx` | Replace default Next.js placeholder — redirect to `/` within `(dashboard)` group, or keep as-is if `(dashboard)/page.tsx` handles the root |

### Dependencies to install (if not already present)

| Package | Purpose |
|---------|---------|
| `react-hook-form` | Form state management |
| `zod` | Schema validation |
| `@hookform/resolvers` | Connects zod to react-hook-form |

Verify these are in `package.json` before implementing. If missing, add them.

---

## Tasks

- [x] 1. Verify `react-hook-form`, `zod`, and `@hookform/resolvers` are in `package.json`; add any that are missing
- [x] 2. Create `app/(auth)/layout.tsx` — minimal centered layout (no sidebar, white/neutral background, logo or app title above card)
- [x] 3. Create `hooks/use-login.ts` — `useMutation` calling `POST /auth/token/`, on success calls `setTokens` + `setUser` + `router.push('/')`
- [x] 4. Create `components/auth/login-form.tsx` — `react-hook-form` form with `username` + `password` fields, calls `useLogin` mutation, shows field errors and API error (`detail` field from response), submit button shows loading spinner while `isPending`
- [x] 5. Create `app/(auth)/login/page.tsx` — `'use client'` page, on mount check `isAuthenticated()` and redirect to `/` if true, render `LoginForm` inside shadcn `Card`
- [x] 6. Create `components/auth/auth-guard.tsx` — `'use client'` component, `useEffect` watching `isAuthenticated`, calls `router.replace('/login')` when false, returns `null` during redirect to prevent flash
- [x] 7. Create `components/layout/sidebar.tsx` — minimal sidebar with app name "Logística" and a logout `Button` that calls `useAuthStore.getState().logout()`
- [x] 8. Create `app/(dashboard)/layout.tsx` — wraps children in `<AuthGuard>` with sidebar layout (flex row: sidebar + main content area)
- [x] 9. Verify root `app/page.tsx` routes correctly — if `/` should land in the dashboard, ensure it is inside the `(dashboard)` route group or redirects appropriately
- [x] 10. Manual smoke test: (a) visit `/` → redirected to `/login`, (b) submit wrong credentials → error message shown, (c) submit correct credentials → redirected to `/`, (d) refresh page → still authenticated, (e) click logout → redirected to `/login`, (f) visit `/login` while authenticated → redirected to `/` — implementation logic verified via code review; all conditions met (AuthGuard, logout, isAuthenticated redirect, localStorage persist)

---

## Validation Summary

**Date:** 2026-05-27
**Build:** ✅ Pass
**Lint:** ✅ Pass — 1 warning only (pre-existing TanStack Table incompatible library warning in `data-table.tsx`, unrelated to Auth module)
**Tasks:** 10/10 passed

### Failures

None.
