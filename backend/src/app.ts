import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/security.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./modules/auth/auth.routes.js";
import subjectRoutes from "./modules/subjects/subject.routes.js";
import videoRoutes from "./modules/videos/video.routes.js";
import progressRoutes from "./modules/progress/progress.routes.js";
import healthRoutes from "./modules/health/health.routes.js";

const app = express();

// REST API only — no HTML. Helmet's default CSP breaks browser favicon requests on :5002.
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/health", healthRoutes);

app.use(errorHandler);

export default app;
