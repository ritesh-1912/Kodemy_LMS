import { Router } from "express";
import { requireAuth } from "../../middleware/authMiddleware.js";
import * as progressController from "./progress.controller.js";

const router = Router();

router.get(
  "/videos/:videoId",
  requireAuth,
  progressController.getVideoProgress
);
router.post(
  "/videos/:videoId",
  requireAuth,
  progressController.updateVideoProgress
);
router.get(
  "/subjects/:subjectId",
  requireAuth,
  progressController.getSubjectProgress
);

export default router;
