import "dotenv/config";
import http from "node:http";
import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes";
import { chatRouter } from "./modules/chat/chat.routes";
import { userRouter } from "./modules/user/user.routes";
import { errorHandler } from "./packages/error-handler/error-middleware";
import { prisma } from "./configs/prisma/client";
import { ensureRedisConnection, redis } from "./configs/redis";
import { closeRabbitConnection, startRabbitConsumers } from "./configs/rabbitmq/rabbitmq";
import { deliverOtp } from "./packages/sendMail/sendOtp";
import { attachWebSocketServer, closeWebSocketServer } from "./modules/chat/chat.gateway";
import { startDailyMessageCleanup, stopDailyMessageCleanup } from "./jobs/cleanupMessages";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { message: "Backend healthy" } });
});

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/user", userRouter);

app.use(errorHandler);

const httpServer = http.createServer(app);
attachWebSocketServer(httpServer);

httpServer.on("error", (error) => {
  console.error("[BOOT] http server error", error);
});

const start = async (): Promise<void> => {
  await ensureRedisConnection();

  await startRabbitConsumers(
    async (payload) => {
      await deliverOtp(payload);
    },
    async (_payload) => {
      // Message real-time broadcast is handled inline in chatService.sendMessage.
      // This consumer is reserved for side effects (push notifications, audit logs).
    },
  );

  startDailyMessageCleanup();

  httpServer.listen(port, () => {
    console.log(`[BOOT] server running on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error("[BOOT] startup failed", error);
  process.exit(1);
});

const shutdown = async (): Promise<void> => {
  console.log("[BOOT] shutting down");
  stopDailyMessageCleanup();
  await closeWebSocketServer();
  await closeRabbitConnection();
  await redis.quit();
  await prisma.$disconnect();

  httpServer.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
