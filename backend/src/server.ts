import "dotenv/config";
import http from "http";
import createApp from "./app";
import connectDB from "./config/db";
import { connectRabbitMQ } from "./config/rabbitmq";
import { initWebSocket } from "./socket/wsServer";

const PORT = process.env.PORT ?? 5000;

const start = async (): Promise<void> => {
  await connectDB();
  await connectRabbitMQ();

  const app = createApp();
  const server = http.createServer(app);

  initWebSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
