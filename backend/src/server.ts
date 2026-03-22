import http from "http";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { connectRabbitMQ } from "./config/rabbitmq";
import { initWebSocket } from "./socket/socket";

async function main(): Promise<void> {
  await connectDB();
  await connectRabbitMQ();

  const server = http.createServer(app);
  initWebSocket(server);

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
