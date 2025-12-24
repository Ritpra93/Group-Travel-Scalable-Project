import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './common/utils/logger';
import { disconnectDatabase } from './config/database';
import { disconnectRedis, createRedisClient } from './config/redis';

/**
 * Server instance
 */
let server: http.Server;

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize Redis connection
    logger.info('Connecting to Redis...');
    await createRedisClient();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    server = http.createServer(app);

    // Start listening
    server.listen(env.PORT, () => {
      logger.info(`Server started successfully`, {
        port: env.PORT,
        environment: env.NODE_ENV,
        nodeVersion: process.version,
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${env.PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${env.PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 *
 * Handles SIGTERM and SIGINT signals to gracefully shut down the server
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown`);

  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connections
        await disconnectDatabase();
        logger.info('Database connections closed');

        // Close Redis connections
        await disconnectRedis();
        logger.info('Redis connections closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', { error });
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason });
  process.exit(1);
});

// Start the server
startServer();
