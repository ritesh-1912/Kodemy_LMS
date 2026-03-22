import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = auth.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    if (!payload.sub) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }
    req.user = { id: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
