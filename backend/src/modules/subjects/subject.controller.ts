import type { Request, Response } from "express";
import * as subjectService from "./subject.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(req.query.pageSize as string) || 12)
  );
  const q = (req.query.q as string)?.trim() || undefined;

  const result = await subjectService.listSubjects({ page, pageSize, q });
  res.json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const subject = await subjectService.getSubject(
    req.params.subjectId as string
  );
  if (!subject) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(subject);
}

export async function getTree(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const tree = await subjectService.getSubjectTree(
    req.params.subjectId as string,
    userId
  );
  if (!tree) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(tree);
}

export async function getFirstVideo(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user!.id;
  const videoId = await subjectService.getFirstUnlockedVideo(
    req.params.subjectId as string,
    userId
  );
  res.json({ video_id: videoId });
}
