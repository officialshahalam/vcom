import type { NextFunction, Request, Response } from "express";
import { AppError } from "./app-error";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  console.error("[ERROR]", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
