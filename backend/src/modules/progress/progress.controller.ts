import type { Request, Response } from "express";
import { z } from "zod";
import * as progressService from "./progress.service.js";

const progressUpdateSchema = z.object({
  last_position_seconds: z.number().nonnegative(),
  is_completed: z.boolean(),
});

export async function getVideoProgress(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user!.id;
  const result = await progressService.getVideoProgress(
    userId,
    req.params.videoId as string
  );
  res.json(result);
}

export async function updateVideoProgress(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user!.id;
  const parsed = progressUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await progressService.updateVideoProgress(
      userId,
      req.params.videoId as string,
      parsed.data
    );
    res.json(result);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status ?? 500).json({ error: e.message });
  }
}

export async function getSubjectProgress(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user!.id;
  try {
    const result = await progressService.getSubjectProgress(
      userId,
      req.params.subjectId as string
    );
    res.json(result);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status ?? 500).json({ error: e.message });
  }
}
