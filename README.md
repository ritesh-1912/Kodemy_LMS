# Kodemy — Learning Management System

**Kodemy** is a small, full-stack learning app. Learners browse **courses (subjects)**, watch **YouTube** lessons in a **fixed order** (you unlock the next video only after finishing the previous one), and **resume** where they left off. The UI is **dark-first** and minimal.

This repo is a **monorepo**: a **Node.js API** and a **Next.js** website. Data is stored with **Prisma** (see `backend/prisma/schema.prisma`).

---

## What’s inside (plain English)

| Piece | Role |
|--------|------|
| **Frontend** (`frontend/`) | Next.js 14 site: home (course list), login/register, subject pages with sidebar, video player, profile. |
| **Backend** (`backend/`) | Express REST API: auth (JWT + refresh cookie), subjects, videos, progress, health check. |
| **Database** | Prisma talks to a database via `DATABASE_URL`. **Local dev** uses **SQLite** by default; **production** can use **MySQL** (e.g. Aiven) by changing the provider and URL. |

You **never upload video files** — only **YouTube links** are stored.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| API | Node.js, Express, TypeScript |
| ORM | **Prisma** (`backend/prisma/`) |
| Auth | Access JWT (short-lived) + refresh token in **HTTP-only cookie** |
| Web | Next.js 14 (App Router), React, Tailwind CSS |
| State | Zustand |
| Video | `react-youtube` (YouTube iframe API) |

---

## Folder layout

```
.
├── backend/          # API server (Prisma schema & migrations live here)
│   ├── prisma/       # schema.prisma, seed, local SQLite file (gitignored)
│   └── src/          # Express app, routes, auth, ordering logic, tests
├── frontend/         # Next.js app
│   └── src/          # pages, components, stores, API client
├── docs/             # Extra documentation
├── scripts/          # dev.sh — run API + frontend together
├── README.md         # this file
└── SPEC.md           # checklist: spec vs implementation
```

The **root `package.json`** includes helper scripts that delegate to `backend/` and `frontend/`. Use **`backend/`** for all Prisma commands.

---

## Quick start (local)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment files

**Backend** — copy the example and adjust if needed:

```bash
cp backend/.env.example backend/.env
```

Typical local values: `PORT=5002`, `DATABASE_URL="file:./prisma/dev.db"`, JWT secrets, and `CORS_ORIGIN` listing your Next.js origin (e.g. `http://localhost:3000` and `http://127.0.0.1:3000` if you use that).

**Frontend** — first time only:

```bash
cp frontend/.env.example frontend/.env.local
```

Set `NEXT_PUBLIC_API_BASE_URL` to your API base (e.g. `http://localhost:5002/api`). Set `NEXT_PUBLIC_SITE_URL` to the same origin as the site (e.g. `http://localhost:3000`).

### 3. Database (Prisma)

From **`backend/`**:

```bash
npx prisma generate
npx prisma db push
npm run db:seed    # optional: sample subjects & videos
```

### 4. Run the app

**Option A — one command** (from repo root):

```bash
chmod +x scripts/dev.sh
npm run dev:all
```

**Option B — two terminals**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- **Website:** http://localhost:3000
- **API health:** http://localhost:5002/api/health

If you change the Next port, update **`CORS_ORIGIN`** in `backend/.env` so it matches the browser origin exactly.

> **Note:** The repo root may also contain an older Next app on another port (`npm run dev` → :3001). For Kodemy, use **`frontend/`** and **`npm run dev:all`** as above.

---

## Useful commands

| Command | Where | What it does |
|---------|--------|----------------|
| `npm run dev:all` | root | Starts backend + frontend (`scripts/dev.sh`) |
| `npm run verify` | root | Backend tests + builds + frontend lint + build |
| `npm test` | `backend/` | Vitest (ordering logic tests) |
| `npm run db:seed` | `backend/` | Seed sample data |
| `npx prisma studio` | `backend/` | Browse/edit DB in the browser |

---

## Production deployment (overview)

Typical setup:

| Piece | Suggested host | Notes |
|--------|----------------|--------|
| API | Render, Railway, etc. | Node process; set env vars; health check on `GET /api/health` |
| Frontend | Vercel | Build `frontend/`; set `NEXT_PUBLIC_API_BASE_URL` to your public API URL |
| Database | Aiven MySQL or any MySQL | Set Prisma `provider` to `mysql` in `schema.prisma`, set `DATABASE_URL`, run migrations |

Use **HTTPS** in production. For **cross-site** cookies (Vercel + Render), the API sets `SameSite=None` and `Secure` in production — configure **`CORS_ORIGIN`** and **`COOKIE_DOMAIN`** to match your domains.

More detail: **[docs/DATABASE.md](./docs/DATABASE.md)** and **[SPEC.md](./SPEC.md)**.

---

## Documentation in this repo

| File | Content |
|------|--------|
| **README.md** | Overview, setup, commands (this file) |
| **SPEC.md** | Requirements checklist vs current code |
| **[docs/DATABASE.md](./docs/DATABASE.md)** | Prisma, SQLite vs MySQL, where the schema lives |
| **[docs/VERCEL-AND-RENDER.md](./docs/VERCEL-AND-RENDER.md)** | Fix empty homepage / 500 from API on Vercel + Render |

---

## Learn more

- [Next.js](https://nextjs.org/docs) · [Express](https://expressjs.com/) · [Prisma](https://www.prisma.io/docs)
