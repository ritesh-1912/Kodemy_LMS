/** Must match backend PORT + `/api`. Restart `next dev` after changing .env.local */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002/api";
