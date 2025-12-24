import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper for Express route handlers
 *
 * Catches any errors thrown by async route handlers and passes them to the error middleware
 *
 * @param fn - Async route handler function
 * @returns Wrapped function that handles errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
