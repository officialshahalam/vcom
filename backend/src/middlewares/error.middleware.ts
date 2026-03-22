import { Request, Response, NextFunction } from "express";
import { logError } from "../shared/logger";

interface AppError extends Error {
  statusCode?: number;
}

function errorMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logError("Unhandled error", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
}

export default errorMiddleware;
