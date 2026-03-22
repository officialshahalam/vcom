import http from "http";
import { createApp } from "./app";
import { connectDatabase } from "../config/db";
import { connectRabbitMQ, closeRabbitMQ } from "../config/rabbitmq";
import { createSocketServer } from "../realtime/socket.server";
import env from "../config/env";
import { logInfo, logError } from "../shared/logger";

async function main(): Promise<void> {
  await connectDatabase();
  logInfo("MongoDB connected");

  await connectRabbitMQ();
  logInfo("RabbitMQ connected");

  const app = createApp();
  const server = http.createServer(app);
  createSocketServer(server);

  server.listen(env.port, () => {
    logInfo(`VCOM backend running on port ${env.port}`);
  });

  process.on("SIGTERM", async () => {
    logInfo("SIGTERM received – shutting down");
    await closeRabbitMQ();
    process.exit(0);
  });
}

main().catch((err) => {
  logError("Failed to start server", err);
  process.exit(1);
});
