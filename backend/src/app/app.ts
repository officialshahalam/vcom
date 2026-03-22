import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import env from "../config/env";
import apiRoutes from "../routes";
import errorMiddleware from "../middlewares/error.middleware";

export function createApp(): Application {
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
