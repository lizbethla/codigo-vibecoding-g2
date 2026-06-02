# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 App Router · TypeScript · React 19 · Tailwind CSS v4 · ESLint

## Gotchas

- **Tailwind v4**: Uses `@tailwindcss/postcss` plugin — NOT the v3 `tailwindcss` PostCSS plugin. Do not revert to v3 syntax or config format.
- **ESLint flat config**: Config is `eslint.config.mjs` (ESLint 9+ flat format). Do not create `.eslintrc.*` files.
- **App Router only**: No Pages Router. All routes live under `app/`. Do not use `pages/`.
- **No Prettier**: Only ESLint. Do not add Prettier config unless explicitly asked.

## Commands

```bash
npm run dev       # dev server → http://localhost:3000
npm run build     # production build (runs tsc + next build)
npm run lint      # eslint (flat config)
```

> Claude must never run `npm run dev` — user starts the dev server manually.

## Path Aliases

`@/*` maps to the project root. Use `@/app/...`, `@/components/...`, etc. — not relative imports from deep paths.

## Backend API

**Backend repo:** `../logistica-api-claudecode` (Django 6 + DRF)  
**Base URL (dev):** `http://127.0.0.1:8000/api/v1`  
**Auth:** JWT Bearer — `Authorization: Bearer <access_token>`  
**Swagger UI:** `http://127.0.0.1:8000/api/schema/swagger-ui/`

Required env var in `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### Modules

| Module | Path | Docs |
|--------|------|------|
| Auth | `/auth/token/` | @docs/api-overview.md |
| Customers | `/customers/` | @docs/modules/customers.md |
| Suppliers | `/suppliers/` | @docs/modules/suppliers.md |
| Products | `/products/` | @docs/modules/products.md |
| Warehouses | `/warehouses/` | @docs/modules/warehouses.md |
| Drivers | `/drivers/` | @docs/modules/drivers.md |
| Vehicles | `/vehicles/` | @docs/modules/transport.md |
| Routes + Stops | `/routes/` | @docs/modules/routes.md |
| Shipments + Products | `/shipments/` | @docs/modules/shipments.md |

**TypeScript types for all modules:** @docs/schemas/index.ts

### API patterns to follow

- All list responses are paginated — type `PaginatedResponse<T>` from `@docs/schemas/index.ts`
- All decimal/money fields come as **strings** — parse with `parseFloat()` for math, keep as string for display
- `tracking_code` on shipments is auto-generated — never send it in POST body
- `created_at` / `updated_at` / `line_total` are read-only — never send in POST/PUT body
- Nested resources use `/parent/{id}/child/` URL pattern (e.g. `/routes/{id}/stops/`)
- `country` fields default to `"Colombia"` — only send if different
- PATCH for partial updates (status changes, assigning driver/vehicle); PUT requires all required fields

## Development Workflow (SDD)

**Always use the Orchestrator agent.** Start every session with:

```
/agent:orchestrator
```

The orchestrator reads `docs/mvp.md` and tells you exactly which agent to run next.

### SDD phases (one module at a time)

```
/agent:spec        → writes docs/specs/<module>-spec.md, then STOPS
                     ↓ human reviews and approves the spec
/agent:implement   → builds code from approved spec
/agent:validator   → verifies implementation, marks tasks ✅/❌
                     ↓ if all pass → next module
                     ↓ if failures → back to implement
```

Never skip phases. Never work on two modules simultaneously.

### Module order (enforced by FK dependencies)

1. Auth → 2. Customers → 3. Suppliers → 4. Warehouses → 5. Products  
→ 6. Drivers → 7. Vehicles → 8. Routes → 9. Shipments

Full scope: @docs/mvp.md  
Active specs: `docs/specs/` (one file per module, created by spec agent)

## Stack (UI + data)

| Tool | Purpose |
|------|---------|
| shadcn/ui | Component library (`@/components/ui/`) |
| TanStack Query | Server state — all API fetching and mutations |
| TanStack Table | All data tables via shared `DataTable` wrapper |
| Axios | HTTP client — instance in `lib/api.ts` |
| Zustand | Client state — auth token, UI flags (`stores/auth.store.ts`) |

### shadcn/ui — IMPORTANT: must be installed first

shadcn requires manual init before any module is built:
```bash
npx shadcn@latest init        # answer prompts: New York style, Slate color, CSS vars yes
npx shadcn@latest add button input label table badge select dialog form dropdown-menu sheet sidebar card
```

### Shared infrastructure (already built)

| File | Purpose |
|------|---------|
| `lib/api.ts` | Axios instance — auto-injects Bearer token, handles 401 + refresh |
| `lib/query-client.ts` | QueryClient (5min stale, 30min gc) |
| `stores/auth.store.ts` | Zustand auth (token, user, logout) |
| `providers/app-providers.tsx` | Root provider wrapping layout |
| `components/data-table/` | Generic DataTable, Pagination, Toolbar |
| `.env.local` | `NEXT_PUBLIC_API_BASE_URL` |

## Notes

- No test framework configured
- `npm run dev` is always started manually by the user — Claude never runs it
