# Kodemy — specification checklist

This file tracks **what the LMS is supposed to do** and **what the codebase implements**. For a friendly overview and setup steps, read **[README.md](./README.md)** first.

---

## Architecture

| Requirement | Status | Notes |
|-------------|--------|-------|
| Split **API** + **web app** | Done | `backend/` Express, `frontend/` Next.js 14 (App Router) |
| **Prisma** as the data layer | Done | Schema: `backend/prisma/schema.prisma` — **keep using Prisma** |
| **SQLite** for easy local dev | Done | e.g. `DATABASE_URL="file:./prisma/dev.db"` |
| **MySQL** for production | Ready to configure | Set `datasource.provider` + `DATABASE_URL` (e.g. Aiven); run `prisma migrate` |
| **REST** JSON API under `/api` | Done | Entry: `backend/src/app.ts` |

---

## Auth

| Requirement | Status | Notes |
|-------------|--------|-------|
| Register / login | Done | `POST /api/auth/register`, `POST /api/auth/login` |
| JWT **access** token | Done | Short-lived; client sends `Authorization: Bearer` |
| **Refresh** token in HTTP-only cookie | Done | `POST /api/auth/refresh` |
| Logout | Done | `POST /api/auth/logout` (revokes refresh server-side) |
| Protected routes | Done | `requireAuth` middleware |

---

## Domain model (Prisma)

| Entity | Status | Notes |
|--------|--------|-------|
| Users | Done | |
| Subjects (courses) + optional **thumbnail** | Done | Card images |
| Sections | Done | Ordered inside a subject |
| Videos (YouTube URL, order) | Done | No file uploads |
| Enrollments | Done | Auto-created when learner opens content (open catalog) |
| Video progress | Done | Position + completed |
| Refresh tokens | Done | Stored hashed in DB |

---

## Ordering & progress rules

| Requirement | Status | Notes |
|-------------|--------|-------|
| Global video order across sections | Done | `getGlobalVideoSequence` |
| Unlock next video only after previous is completed | Done | `isVideoUnlocked` |
| Unit tests for ordering helpers | Done | `backend/src/utils/ordering.logic.test.ts` |

---

## API surface (summary)

| Area | Routes |
|------|--------|
| Health | `GET /api/health` → `{ "status": "ok" }` |
| Auth | `/api/auth/*` |
| Subjects | Public list + detail; `GET .../tree`, `.../first-video` need login |
| Videos | `GET /api/videos/:videoId` (auth) |
| Progress | `GET/POST /api/progress/videos/:videoId`, `GET /api/progress/subjects/:subjectId` |

---

## Frontend

| Requirement | Status | Notes |
|-------------|--------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Done | `frontend/.env.local` |
| Zustand stores | Done | `frontend/src/store/*` |
| API client + Bearer + cookies | Done | `frontend/src/lib/apiClient.ts` |
| Home: subject listing | Done | Server-side fetch + thumbnails |
| Subject + video routes | Done | `/subjects/[subjectId]/...`, video player + lock UI |
| Login / register | Done | `frontend/src/app/auth/*` |
| Profile | Done | Progress summary |

---

## Security & ops

| Topic | Status | Notes |
|-------|--------|-------|
| CORS (multiple dev origins) | Done | `CORS_ORIGIN` comma-separated in `backend/.env` |
| Helmet on API | Done | CSP disabled for JSON-only API (avoids favicon/CSP issues) |
| Repo verify script | Done | Root: `npm run verify` |

---

## Optional follow-ups

- Switch Prisma to **MySQL** and run **migrations** for production.
- Add explicit **enroll** endpoint if you need paid or invite-only courses (today: auto-enroll on access).
- Add **E2E tests** (e.g. Playwright); CI can use `npm run verify` today.
