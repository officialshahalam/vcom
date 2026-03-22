const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("../config/env");
const apiRoutes = require("../routes");
const errorMiddleware = require("../middlewares/error.middleware");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.use("/api", apiRoutes);

  app.use(errorMiddleware);

  return app;
}

module.exports = {
  createApp,
};
