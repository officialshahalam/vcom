require("dotenv").config();
const http = require("http");
const createApp = require("./src/app");
const connectDB = require("./src/config/db");
const { connectRabbitMQ, consumeMessages, closeRabbitMQ } = require("./src/config/rabbitmq");
const { setupWebSocket } = require("./src/socket/socket.handler");

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await connectRabbitMQ();

  consumeMessages(async (payload) => {
    if (payload.event === "new_message") {
      // Messages are already saved by message.service on send.
      // This consumer is for secondary processing (push notifications, analytics, etc.)
      console.log(`[RabbitMQ] Processed message ${payload.messageId}`);
    }
  });

  const app = createApp();
  const server = http.createServer(app);

  setupWebSocket(server);

  server.listen(PORT, () => {
    console.log(`VCOM backend running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}, shutting down gracefully…`);
    server.close(async () => {
      await closeRabbitMQ();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
