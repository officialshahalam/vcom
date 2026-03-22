const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./modules/auth/auth.route");
const userRoutes = require("./modules/users/user.route");
const messageRoutes = require("./modules/messages/message.route");
const { errorHandler } = require("./middleware/error.middleware");

const createApp = () => {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Logging
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/messages", messageRoutes);

  // 404
  app.use((_req, res) => res.status(404).json({ message: "Not found" }));

  // Error handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
