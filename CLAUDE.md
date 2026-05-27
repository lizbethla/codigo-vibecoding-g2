# Task Manager — Monorepo Guide

Monorepo with two projects that form one full-stack app. Features span both; always check both sides when adding something.

## Projects

| Project | Path | Port | Purpose |
|---------|------|------|---------|
| Backend | `task-manager-backend/` | 3001 | REST API + DB |
| Frontend | `task-manager-frontend/` | 5173 | React SPA |

---

## Backend — `task-manager-backend/`

**Stack:** Node.js · Express 4 · ES Modules · Prisma 7 · PostgreSQL (Neon) · bcrypt · UUID tokens · Swagger UI

**Start:**
```bash
cd task-manager-backend
npm run dev        # node src/index.js (no nodemon wired in scripts)
npx nodemon src/index.js  # for auto-reload
```

**Structure:**
```
src/
  index.js              # server entry, PORT=3001
  app.js                # Express config, CORS (open), route mounting
  domains/
    task/               # task.routes.js → task.controller.js → task.service.js (Prisma)
    users/              # users.routes.js → users.controller.js → users.service.js
  utils/
    prisma.js           # Prisma client singleton
    response.js         # success/error helpers
  docs/swagger.json     # OpenAPI spec
prisma/
  schema.prisma         # DB schema (Task + User models)
  migrations/           # Prisma migration history
```

**API Endpoints:**
```
GET    /api/tasks          get all tasks
POST   /api/tasks          create task        { title, description? }
GET    /api/tasks/:id      get task by id
PUT    /api/tasks/:id      update task        { title?, description?, completed? }
DELETE /api/tasks/:id      delete task

POST   /api/users/register { name, lastname, email, password }
POST   /api/users/login    { email, password } → { user, token }

GET    /api-docs           Swagger UI
```

**DB Models:**
- `User`: id (UUID), name, lastname, email (unique), password (bcrypt), token (session), tasks[]
- `Task`: id (UUID), title, description?, completed (bool), userId (FK), createdAt, updatedAt

**Env vars** (`.env`):
```
DATABASE_URL=postgresql://...neon.tech/neondb?...
PORT=3001  # optional, defaults to 3001
```

**Known issues:**
- `npm run dev` script uses `node`, not `nodemon` — no auto-reload without `npx nodemon`
- CORS wide-open (`cors()` no config) — restrict before production

---

## Frontend — `task-manager-frontend/`

**Stack:** React 19 · TypeScript · Vite 8 · React Router 7 · Axios · Tailwind CSS 4 · Lucide React

**Start:**
```bash
cd task-manager-frontend
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # tsc + vite build
```

**Structure:**
```
src/
  pages/
    HomePage.tsx        # / — task list, create/update/delete
    LoginPage.tsx       # /login — mock login (no backend call)
    TaskDetailPage.tsx  # /tasks/:id — single task view
  components/
    TaskCard.tsx
    TaskList.tsx
    ui/                 # Button, Input, Textarea, Checkbox, Dialog
  services/
    api.ts              # Axios instance + all task API calls
  types/
    Task.ts             # TypeScript interfaces
  App.tsx               # Router setup
```

**API integration** (`src/services/api.ts`):
```typescript
// baseURL hardcoded — no .env set up
const api = axios.create({ baseURL: 'http://localhost:3001/api/tasks' });

taskApi.getAll()         // GET /
taskApi.getById(id)      // GET /:id
taskApi.create(data)     // POST /
taskApi.update(id, data) // PUT /:id
taskApi.delete(id)       // DELETE /:id
```

**Known issues / debt:**
- Login page is mock — validates form but never calls `/api/users/login`
- No token storage (no localStorage/cookie) → no auth header sent
- `baseURL` hardcoded in `api.ts`, no `.env.local` with `VITE_API_BASE_URL`
- No user-scoped tasks — all tasks fetched globally, not per logged-in user

---

## How Projects Communicate

```
Browser (5173)
  └─ Axios → http://localhost:3001/api/tasks → Express (3001)
                                                └─ Prisma → PostgreSQL (Neon)
```

- Backend returns JSON. Frontend uses typed `Task` interface.
- No auth token sent — backend `userId` FK exists in schema but tasks endpoint does not filter by user yet.
- CORS: backend accepts all origins via `cors()`.

---

## Adding a Feature — Task Split

When building a feature, split work like this:

### Backend owns:
- New Prisma model or migration
- New route + controller + service
- Business logic, validation, DB queries
- Swagger doc update (`src/docs/swagger.json`)

### Frontend owns:
- New page or component
- `api.ts` call for the new endpoint
- TypeScript type/interface
- UI state, form handling, routing

### Feature checklist template
```
Feature: <name>
Backend:
  [ ] schema change? → add migration
  [ ] new route in domains/<domain>/
  [ ] update swagger.json
  [ ] test with curl / Swagger UI at /api-docs

Frontend:
  [ ] add call in src/services/api.ts
  [ ] add/update TypeScript type in src/types/
  [ ] build page or component
  [ ] wire route in App.tsx if new page
  [ ] test in browser at localhost:5173
```

### Priority debt to address first:
1. **Auth connection** — wire `LoginPage` to `POST /api/users/login`, store token, send as `Authorization: Bearer <token>` header
2. **Env config** — add `VITE_API_BASE_URL` to `task-manager-frontend/.env.local`
3. **Task ownership** — filter tasks by authenticated user (backend + frontend)
4. **Nodemon** — add `"dev": "nodemon src/index.js"` to backend `package.json`

---

## Dev Workflow

> **IMPORTANT — Claude must never run dev servers.**
> `npm run dev`, `npx nodemon`, and any long-running server command are always executed **manually by the user**.
> Claude only edits files. The user starts and stops servers themselves.

Commands for reference (user runs these, not Claude):

```bash
# Terminal 1 — backend
cd task-manager-backend && npx nodemon src/index.js

# Terminal 2 — frontend
cd task-manager-frontend && npm run dev
```

Backend API docs always available at `http://localhost:3001/api-docs`.
