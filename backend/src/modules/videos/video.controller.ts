import type { Request, Response } from "express";
import * as videoService from "./video.service.js";

export async function getById(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const meta = await videoService.getVideoMeta(req.params.videoId as string, userId);
  if (!meta) {
    res.status(404).json({ error: "Video not found" });
    return;
  }
  res.json(meta);
}
