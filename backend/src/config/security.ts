import { env } from "./env.js";
import type { CorsOptions } from "cors";
import type { CookieOptions } from "express";

const ACCESS_TOKEN_MINUTES = 15;
const REFRESH_TOKEN_DAYS = 30;

export const jwtConfig = {
  accessSecret: new TextEncoder().encode(env.JWT_ACCESS_SECRET),
  refreshSecret: new TextEncoder().encode(env.JWT_REFRESH_SECRET),
  accessExpiresSeconds: ACCESS_TOKEN_MINUTES * 60,
  refreshExpiresDays: REFRESH_TOKEN_DAYS,
} as const;

export const corsOptions: CorsOptions = {
  origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export function refreshCookieOptions(expiresAt: Date): CookieOptions {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
    expires: expiresAt,
  };
}

export const REFRESH_COOKIE_NAME = "refresh_token";
