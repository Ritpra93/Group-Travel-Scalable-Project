/**
 * Socket.IO Server Setup
 * Initializes Socket.IO with Redis adapter and authentication
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from '../common/utils/logger';
import { socketAuthMiddleware } from './socket.middleware';
import { registerConnectionHandlers } from './handlers/connection.handler';
import { registerRoomHandlers } from './handlers/room.handler';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './socket.types';

/**
 * Socket.IO server instance
 */
let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

/**
 * Initialize Socket.IO server with Redis adapter
 *
 * @param httpServer - HTTP server to attach Socket.IO to
 * @returns Configured Socket.IO server instance
 */
export async function initializeSocketIO(
  httpServer: HttpServer
): Promise<SocketIOServer> {
  // Parse frontend URLs for CORS
  const frontendUrls = env.FRONTEND_URL.split(',').map((url) => url.trim());

  // Create Socket.IO server
  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: frontendUrls,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Setup Redis adapter for horizontal scaling
  try {
    const pubClient = createClient({ url: env.REDIS_URL });
    const subClient = pubClient.duplicate();

    // Handle Redis errors
    pubClient.on('error', (err) => {
      logger.error('Redis pub client error', { error: err.message });
    });
    subClient.on('error', (err) => {
      logger.error('Redis sub client error', { error: err.message });
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter initialized');
  } catch (error) {
    logger.warn('Failed to initialize Redis adapter, using in-memory adapter', {
      error: (error as Error).message,
    });
    // Socket.IO will use default in-memory adapter
  }

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Register event handlers on connection
  io.on('connection', (socket) => {
    registerConnectionHandlers(socket);
    registerRoomHandlers(socket);
  });

  logger.info('Socket.IO server initialized', {
    cors: frontendUrls,
    transports: ['websocket', 'polling'],
  });

  return io;
}

/**
 * Get the Socket.IO server instance
 *
 * @throws Error if Socket.IO is not initialized
 * @returns Socket.IO server instance
 */
export function getIO(): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
}

/**
 * Check if Socket.IO is initialized
 */
export function isSocketIOInitialized(): boolean {
  return io !== null;
}

/**
 * Close Socket.IO server
 */
export function closeSocketIO(): void {
  if (io) {
    io.close();
    io = null;
    logger.info('Socket.IO server closed');
  }
}
