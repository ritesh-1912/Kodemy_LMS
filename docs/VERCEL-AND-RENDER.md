# Vercel + Render — fix empty page / API error 500

Your **Vercel** site loads, but the homepage shows **"API error 500"** and no subjects. That means the **browser called your API** (e.g. `https://…onrender.com/api/subjects`) and the **server returned HTTP 500** — an error **on the server**, not in the Vercel build.

---

## What a 500 usually means here

The API route uses **Prisma** to read the database. A 500 often means one of:

| Cause | What to do |
|--------|------------|
| **`DATABASE_URL` not set** on Render | Add it in Render → Environment |
| **Tables don’t exist** (never ran `db push` / migrate in production) | Run `prisma db push` (or migrate) as part of deploy / once in Shell |
| **No seed data** | You may get an **empty** list (still HTTP 200), not 500 — 500 usually means crash |
| **Wrong app** | The UI in **`frontend/`** is built for the **Express** app in **`backend/`**, not necessarily the **root** Next.js app |

Always check **Render → Logs** (runtime) right after you load the page — Prisma errors show there.

---

## Recommended: deploy the **`backend/`** API on Render

The Kodemy UI under **`frontend/`** expects the **Express + Prisma** API in **`backend/`** (same routes and JSON shapes for auth, tree, videos, progress).

1. **New Render Web Service** → connect the same GitHub repo.
2. **Root Directory:** `backend`
3. **Build Command:**  
   `npm install && npx prisma generate && npm run build && npx prisma db push`
4. **Start Command:** `npm start` (uses `backend/package.json` → `node dist/server.js` after `tsc`)
5. **Environment variables** (examples — use strong secrets in production):

   | Name | Example / note |
   |------|------------------|
   | `DATABASE_URL` | `file:./prisma/prod.db` or a hosted Postgres/MySQL URL |
   | `JWT_ACCESS_SECRET` | Long random string |
   | `JWT_REFRESH_SECRET` | Different long random string |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | `https://kodemy-lms.vercel.app` (your real Vercel URL) |
   | `PORT` | Render injects this — your server should listen on `process.env.PORT` |

6. After the first successful deploy, open **Render → Shell** (or SSH) from the `backend` app folder and run:  
   `npm run db:seed`  
   so you have published subjects and videos.

7. Test: `https://YOUR-BACKEND.onrender.com/api/health` → should return JSON with `"status":"ok"`.

8. In **Vercel** → Project → Environment Variables:

   - `NEXT_PUBLIC_API_BASE_URL` = `https://YOUR-BACKEND.onrender.com/api`  
     (no trailing slash after `api`)

   - `NEXT_PUBLIC_SITE_URL` = `https://kodemy-lms.vercel.app`

9. **Redeploy** the Vercel project so it picks up the new env vars.

---

## Alternative: keep using the **root** Next.js app on Render

If `https://kodemy-lms.onrender.com` is the **repo root** Next app (`npm run build` / `next start`):

1. Set **`DATABASE_URL`** on that service (e.g. `file:./prisma/prod.db`).
2. Use a **Build Command** that creates tables before `next build`, e.g.:  
   `npm install && npx prisma generate && npx prisma db push && npm run build`
3. Run **`npx prisma db seed`** once in Render Shell if you have a seed.
4. Check **Logs** if `/api/subjects` still returns 500.

**Note:** That stack is a different product surface than **`frontend/`** + **`backend/`**. Mixing them can cause subtle API mismatches. For the Kodemy LMS UI in **`frontend/`**, deploying **`backend/`** on Render is the straightforward match.

---

## Quick checks

- **Vercel env:** `NEXT_PUBLIC_API_BASE_URL` must be the API **base including `/api`**, e.g. `https://xxx.onrender.com/api`.
- **CORS:** Backend must allow your Vercel origin in `CORS_ORIGIN` (comma-separated if several).
- **Render free tier:** Services **spin down** when idle; the **first request** can take ~30–60 seconds — refresh once.
