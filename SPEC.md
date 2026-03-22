# Kodemy — specification checklist

This document maps the intended LMS architecture to what exists in **`backend/`** + **`frontend/`**`.

## Architecture

| Requirement | Status | Notes |
|-------------|--------|--------|
| Split **API** + **web app** | Done | `backend/` Express, `frontend/` Next.js 14 (App Router) |
| **Prisma** data layer | Done | `backend/prisma/schema.prisma` |
| **SQLite** local dev | Done | `DATABASE_URL="file:./prisma/dev.db"` |
| **MySQL** production-ready URL | Done | Set `DATABASE_URL` to MySQL/Aiven; change `provider` in schema when deploying |
| **REST** JSON API under `/api` | Done | See `backend/src/app.ts` |

## Auth

| Requirement | Status | Notes |
|-------------|--------|--------|
| **Register / login** | Done | `POST /api/auth/register`, `POST /api/auth/login` |
| **JWT access** token | Done | Returned in JSON; client stores in memory + `Authorization: Bearer` |
| **Refresh** token (HTTP-only cookie) | Done | `POST /api/auth/refresh`; cookie name in `security.ts` |
| **Logout** | Done | `POST /api/auth/logout` |
| **Protected** routes | Done | `requireAuth` middleware |

## Domain model

| Entity | Status |
|--------|--------|
| Users | Done |
| Subjects (courses) + **thumbnail** | Done |
| Sections | Done |
| Videos (YouTube URL, order) | Done |
| **Enrollment** | Done | Auto-created when learner opens tree / video / first-video (open catalog) |
| **Video progress** (position, completed) | Done |
| Refresh token store | Done |

## Ordering & progress

| Requirement | Status | Notes |
|-------------|--------|--------|
| Global **video order** across sections | Done | `getGlobalVideoSequence` |
| **Unlock** next video only after previous completed | Done | `isVideoUnlocked` |
| **Unit tests** for pure ordering | Done | `backend/src/utils/ordering.logic.test.ts` — run `npm test` in `backend/` |

## API surface (summary)

| Area | Routes |
|------|--------|
| Health | `GET /api/health` |
| Auth | `/api/auth/*` |
| Subjects | Public list + detail; `GET .../tree`, `.../first-video` require auth |
| Videos | `GET /api/videos/:videoId` (auth) |
| Progress | `GET/POST /api/progress/videos/:videoId`, `GET .../subjects/:subjectId` |

## Frontend

| Requirement | Status | Notes |
|-------------|--------|--------|
| **Env** `NEXT_PUBLIC_API_BASE_URL` | Done | `frontend/.env.local` |
| **Zustand** auth + UI stores | Done | `frontend/src/store/*` |
| **apiClient** + Bearer + `credentials: 'include'` | Done | `frontend/src/lib/apiClient.ts` |
| Home **subject listing** with thumbnails | Done | Server fetch + `SubjectThumbnail` |
| **`/subjects/[subjectId]/video/[videoId]`** | Done | Player + lock UI + progress |
| **Login / register** | Done | `frontend/src/app/auth/*` |
| **Profile** | Done | `frontend/src/app/profile/page.tsx` |

## Security & ops

| Topic | Status | Notes |
|-------|--------|--------|
| **CORS** multiple dev origins | Done | `CORS_ORIGIN` comma-separated in `backend/.env` |
| **Helmet** without HTML CSP on API | Done | `contentSecurityPolicy: false` in `backend/src/app.ts` |
| **Verify** script | Done | Root `npm run verify` |

## Optional / deployment follow-ups

- Point `datasource.provider` to `mysql` and run migrations for production.
- Add explicit `POST /api/subjects/:id/enroll` if you need **paid** gating (currently auto-enroll on access).
- E2E tests (Playwright) not included; use `npm run verify` for CI-style checks.
