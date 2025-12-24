import { User } from '@prisma/client';

/**
 * Extend Express Request type to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId?: string;
    }
  }
}

export {};
