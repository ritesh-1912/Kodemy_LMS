import { Router } from "express";
import { requireAuth } from "../../middleware/authMiddleware.js";
import * as subjectController from "./subject.controller.js";

const router = Router();

router.get("/", subjectController.list);
router.get("/:subjectId", subjectController.getById);
router.get("/:subjectId/tree", requireAuth, subjectController.getTree);
router.get(
  "/:subjectId/first-video",
  requireAuth,
  subjectController.getFirstVideo
);

export default router;
