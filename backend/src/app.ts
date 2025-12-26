import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { requestId, requestLogger } from './middleware/requestLogger.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { authenticate } from './middleware/auth.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import groupRoutes from './modules/groups/groups.routes';
import invitationsRoutes from './modules/invitations/invitations.routes';
import tripRoutes from './modules/trips/trips.routes';
import pollRoutes, { tripPollsRouter } from './modules/polls/polls.routes';
import expenseRoutes, { tripExpensesRouter } from './modules/expenses/expenses.routes';

/**
 * Create and configure Express application
 *
 * @returns Configured Express app
 */
export function createApp(): Application {
  const app = express();

  // ============================================================================
  // Security Middleware
  // ============================================================================

  // Helmet - Security headers
  app.use(helmet());

  // CORS - Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    })
  );

  // ============================================================================
  // Request Processing Middleware
  // ============================================================================

  // Compression
  app.use(compression());

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID generation
  app.use(requestId);

  // Request logging
  app.use(requestLogger);

  // ============================================================================
  // API Routes
  // ============================================================================

  // Health check endpoint (no rate limiting)
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
      },
    });
  });

  // Readiness check endpoint (checks dependencies)
  app.get('/health/ready', async (req, res) => {
    try {
      const { testKyselyConnection } = await import('./config/kysely');
      const { testRedisConnection } = await import('./config/redis');

      const [dbHealthy, redisHealthy] = await Promise.all([
        testKyselyConnection(),
        testRedisConnection(),
      ]);

      const isReady = dbHealthy && redisHealthy;

      res.status(isReady ? 200 : 503).json({
        success: isReady,
        data: {
          status: isReady ? 'ready' : 'not_ready',
          timestamp: new Date().toISOString(),
          checks: {
            database: dbHealthy ? 'healthy' : 'unhealthy',
            redis: redisHealthy ? 'healthy' : 'unhealthy',
          },
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
        },
      });
    }
  });

  // API v1 routes with rate limiting
  app.use('/api/v1', apiRateLimiter);

  // Authentication routes (public)
  app.use('/api/v1/auth', authRoutes);

  // Protected routes (require authentication)
  app.use('/api/v1/groups', groupRoutes);
  app.use('/api/v1/invitations', invitationsRoutes);
  app.use('/api/v1/trips', tripRoutes);
  app.use('/api/v1/polls', pollRoutes);
  app.use('/api/v1/expenses', expenseRoutes);

  // Trip-scoped routes
  app.use('/api/v1/trips/:tripId/polls', tripPollsRouter);
  app.use('/api/v1/trips/:tripId/expenses', tripExpensesRouter);

  // ============================================================================
  // Error Handling
  // ============================================================================

  // 404 handler - Must be after all routes
  app.use(notFoundHandler);

  // Global error handler - Must be last
  app.use(errorHandler);

  return app;
}
