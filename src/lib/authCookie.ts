/**
 * Refresh-token cookie options for Vercel (origin A) → API on Render (origin B).
 * Cross-site cookies need SameSite=None + Secure in production.
 */
export function refreshCookieOptions(expires: Date) {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite: "lax" | "none" | "strict" = isProd ? "none" : "lax";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: "/",
    domain: process.env.COOKIE_DOMAIN || undefined,
    expires,
  };
}
