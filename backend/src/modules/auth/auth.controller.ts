import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.validator.js";
import * as authService from "./auth.service.js";
import {
  refreshCookieOptions,
  REFRESH_COOKIE_NAME,
} from "../../config/security.js";

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await authService.registerUser(parsed.data);
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshTokenPlain,
      refreshCookieOptions(result.expiresAt)
    );
    res.status(201).json({
      access_token: result.accessToken,
      user: result.user,
    });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status ?? 500).json({ error: e.message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await authService.loginUser(parsed.data);
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshTokenPlain,
      refreshCookieOptions(result.expiresAt)
    );
    res.json({
      access_token: result.accessToken,
      user: result.user,
    });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status ?? 500).json({ error: e.message });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshTokenPlain =
    req.cookies?.[REFRESH_COOKIE_NAME] ?? req.body?.refresh_token;

  if (!refreshTokenPlain) {
    res.status(401).json({ error: "Missing refresh token" });
    return;
  }

  try {
    const result = await authService.refreshAccessToken(refreshTokenPlain);
    res.json({ access_token: result.accessToken });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status ?? 500).json({ error: e.message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const refreshTokenPlain = req.cookies?.[REFRESH_COOKIE_NAME];
  if (refreshTokenPlain) {
    await authService.revokeRefreshToken(refreshTokenPlain);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
  res.json({ success: true });
}
