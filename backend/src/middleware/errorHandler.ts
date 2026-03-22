import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation error",
      details: err.flatten(),
    });
    return;
  }

  console.error("[ERROR]", err.message, err.stack);
  res.status(500).json({ error: "Internal server error" });
}
