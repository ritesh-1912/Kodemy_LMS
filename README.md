# Kodemy (LMS)

**Specification vs implementation:** see [`SPEC.md`](./SPEC.md).

Monorepo layout:

- **`backend/`** — Express + Prisma API (default **:5002**)
- **`frontend/`** — Next.js 14 app (default **:3000**)

The older Next app at the repo root (`npm run dev` → :3001) is separate; use **`frontend/`** for the Kodemy UI.

## One command (recommended)

From the repo root (the folder that contains `backend/` and `frontend/`):

```bash
chmod +x scripts/dev.sh
npm run dev:all
```

Or:

```bash
bash scripts/dev.sh
```

Then open **http://localhost:3000**. API health: **http://localhost:5002/api/health**

## Two terminals (alternative)

**Terminal 1 — API**

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Terminal 2 — site**

```bash
cd frontend
npm install
cp .env.example .env.local   # first time only; edit if needed
npm run dev
```

## Environment (already wired in repo)

| File | Purpose |
|------|--------|
| `backend/.env` | `PORT=5002`, `CORS_ORIGIN` lists localhost + 127.0.0.1 on 3000–3002 |
| `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL=http://localhost:5002/api`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000` |

If you run Next on another port (e.g. 3002), set **`NEXT_PUBLIC_SITE_URL`** to that same origin and ensure **`CORS_ORIGIN`** in `backend/.env` includes it.

## Seed data (optional)

```bash
cd backend && npm run db:seed
```

Course cards use **cover images** from the `thumbnail` field (Unsplash URLs in the seed). After schema changes:

```bash
cd backend && npx prisma db push && npm run db:seed
```

## Tests & checks

```bash
npm run verify
```

Runs backend **Vitest** unit tests, backend `tsc` build, frontend **ESLint**, and frontend **production build**.

Or only backend tests:

```bash
cd backend && npm install && npm test
```

## Learn More

- [Next.js](https://nextjs.org/docs)
- [Express](https://expressjs.com/)
