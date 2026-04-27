import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export const validateRequest = (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction): void => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues,
    });
    return;
  }

  next();
};
