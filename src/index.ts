import { config } from '@/config/app.config';
import { ApolloServer } from 'apollo-server-express';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { Server } from 'socket.io';

import { errorHandler } from '@/middleware/errorHandler';
// import { rateLimiter } from '@/middleware/rateLimiter';
import { apiRoutes } from '@/routes/api';
import { healthCheck } from '@/routes/health';
import { rootRoutes } from '@/routes/root';
import { uploadRoutes } from '@/routes/upload';
import { logger } from '@/utils/logger';

import { connectDatabase } from '@/config/database';
import { connectRedis } from '@/config/redis';
import { context } from '@/graphql/context';
import { schema } from '@/graphql/schema';
import { socketHandler } from '@/socket/socketHandler';

const app = express();
const PORT = config.app.port;

// Initialize application
logger.info('Application starting up', {
  environment: config.app.environment,
  port: PORT,
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.allowedOrigins,
    credentials: config.cors.credentials,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  })
);

// Rate limiting
// app.use(rateLimiter);

// Routes
app.use('/', rootRoutes);
app.use('/health', healthCheck);
app.use('/upload', uploadRoutes);
app.use('/api', apiRoutes);

// GraphQL setup
const server = new ApolloServer({
  schema,
  context,
  introspection: config.graphql.introspection,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  formatError: error => {
    logger.error('GraphQL Error', { error: error.message });
    return {
      message: error.message,
      path: error.path || [],
      extensions: error.extensions,
    };
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    {
      requestDidStart: async (): Promise<{
        willSendResponse: ({
          response,
        }: {
          response: { errors?: unknown };
        }) => Promise<void>;
      }> => ({
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        willSendResponse: async ({
          response,
        }: {
          response: { errors?: unknown };
        }) => {
          if ((response as { errors?: unknown }).errors) {
            logger.error('GraphQL Response Errors', {
              errors: (response as { errors?: unknown }).errors,
            });
          }
        },
      }),
    },
  ],
});

// Start Apollo Server
async function startApolloServer(): Promise<void> {
  await server.start();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.applyMiddleware({ app: app as any, path: '/graphql' });
}

// Socket.IO setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.socket.cors.origin,
    credentials: config.socket.cors.credentials,
  },
});

// Socket.IO connection handling
socketHandler(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('Connected to MongoDB Atlas');

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis ElastiCache');

    await startApolloServer();

    httpServer.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: config.app.environment,
        graphqlPath: server.graphqlPath,
        socketIO: true,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Application shutting down due to ${signal}`);

  try {
    // Close HTTP server
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    // Close Socket.IO connections
    io.close(() => {
      logger.info('Socket.IO server closed');
    });

    // Close logger gracefully
    logger.end();

    // Force exit after timeout
    setTimeout(() => {
      process.exit(1);
    }, 5000);

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', () => {
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', () => {
  gracefulShutdown('unhandledRejection');
});

// Start the application
startServer();
