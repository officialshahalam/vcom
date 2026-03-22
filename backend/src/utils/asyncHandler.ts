export const asyncHandler =
  <T>(
    fn: (
      req: import("express").Request,
      res: import("express").Response,
      next: import("express").NextFunction
    ) => Promise<T>
  ) =>
  (
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction
  ): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
