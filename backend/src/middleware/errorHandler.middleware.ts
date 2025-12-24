import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../common/utils/errors';
import { logger, logError } from '../common/utils/logger';
import { env, isProduction } from '../config/env';
import type { ApiResponse } from '../common/types/api';

/**
 * Global error handling middleware
 *
 * Catches all errors and formats them into a consistent API response
 * Logs errors with appropriate level based on status code
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  // Handle custom application errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  }
  // Handle Zod validation errors
  else if (error instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
  }
  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    code = prismaError.code;
    message = prismaError.message;
    details = prismaError.details;
  }
  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
    details = isProduction ? undefined : error.message;
  }
  // Handle JWT errors (should be caught by auth middleware, but just in case)
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  }
  // Unknown errors
  else {
    message = isProduction ? 'An unexpected error occurred' : error.message;
    details = isProduction ? undefined : error.stack;
  }

  // Log error with appropriate level
  if (statusCode >= 500) {
    logError(error, 'Error handler', {
      statusCode,
      code,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
      requestId: req.requestId,
    });
  } else if (statusCode >= 400) {
    logger.warn('Client error', {
      statusCode,
      code,
      message,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
      requestId: req.requestId,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

/**
 * Handle Prisma-specific errors
 *
 * @param error - Prisma error
 * @returns Formatted error object
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
} {
  switch (error.code) {
    // Unique constraint violation
    case 'P2002': {
      const target = (error.meta?.target as string[]) || [];
      return {
        statusCode: 409,
        code: 'CONFLICT',
        message: `A record with this ${target.join(', ')} already exists`,
        details: { fields: target },
      };
    }
    // Foreign key constraint violation
    case 'P2003':
      return {
        statusCode: 400,
        code: 'INVALID_REFERENCE',
        message: 'Invalid reference to related record',
      };
    // Record not found
    case 'P2025':
      return {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Record not found',
      };
    // Record required but not found
    case 'P2018':
      return {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Required record not found',
      };
    // Default Prisma error
    default:
      return {
        statusCode: 500,
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
        details: isProduction ? undefined : error.message,
      };
  }
}

/**
 * 404 Not Found handler
 * Should be registered after all routes
 */
export function notFoundHandler(
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
}
