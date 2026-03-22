import { Router } from "express";
import { requireAuth } from "../../middleware/authMiddleware.js";
import * as videoController from "./video.controller.js";

const router = Router();

router.get("/:videoId", requireAuth, videoController.getById);

export default router;
