# Database (Prisma)

Kodemy uses **Prisma** only under **`backend/`**.

## Local development (default)

- **Engine:** SQLite
- **Config:** `DATABASE_URL` in `backend/.env`, e.g.  
  `DATABASE_URL="file:./prisma/dev.db"`
- **Apply schema:** from `backend/`, run `npx prisma db push` (or `migrate` once you use migrations).
- **Sample data:** `npm run db:seed`

The SQLite file is usually **gitignored** — each machine has its own DB.

## Production (e.g. MySQL on Aiven)

1. In `backend/prisma/schema.prisma`, set `provider = "mysql"` on the `datasource` block.
2. Set `DATABASE_URL` to your MySQL connection string (include SSL if your host requires it).
3. Run **`prisma migrate deploy`** (or `migrate dev` in a safe environment) from **`backend/`**.

You do **not** need to change application code for MySQL if the Prisma schema matches — only the provider and URL.

## Where to look

| File | Purpose |
|------|--------|
| `backend/prisma/schema.prisma` | Models: users, subjects, sections, videos, progress, refresh tokens |
| `backend/prisma/seed.ts` | Demo courses and videos |
