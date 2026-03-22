import express, { Application, Request, Response } from "express";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler, notFound } from "./middleware/errorHandler";
import userRoutes from "./routes/userRoutes";
import messageRoutes from "./routes/messageRoutes";

const createApp = (): Application => {
  const app = express();

  // ── Middleware ──────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "*",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(requestLogger);

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ success: true, message: "vCom API is running" });
  });

  app.use("/api/users", userRoutes);
  app.use("/api/messages", messageRoutes);

  // ── Error handling ──────────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
