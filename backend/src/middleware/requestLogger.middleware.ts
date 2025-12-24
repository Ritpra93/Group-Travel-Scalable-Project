import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logRequest } from '../common/utils/logger';

/**
 * Request ID middleware
 *
 * Generates a unique ID for each request for tracing
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * Request logger middleware
 *
 * Logs all HTTP requests with method, URL, status code, and duration
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;

    logRequest(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      duration,
      req.user?.id,
      {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
  });

  next();
}
