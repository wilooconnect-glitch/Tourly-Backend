import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getEnv = (name: string, defaultValue?: string): string | undefined => {
  return process.env[name] || defaultValue;
};

const getBoolEnv = (name: string, defaultValue = false): boolean => {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

const getNumberEnv = (name: string, defaultValue: number): number => {
  const value = process.env[name];
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

export const config = {
  // Application
  app: {
    name: 'SND CRM Backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: getEnv('NODE_ENV', 'development'),
    port: getNumberEnv('PORT', 8081),
    host: getEnv('HOST', '0.0.0.0'),
    frontendUrl: getEnv('FRONTEND_URL', 'https://yourdomain.com'),
    supportEmail: getEnv('SUPPORT_EMAIL', 'support@yourdomain.com'),
  },

  // Database
  database: {
    mongodb: {
      uri: requireEnv('MONGODB_URI'),
      options: {
        maxPoolSize: getNumberEnv('MONGODB_MAX_POOL_SIZE', 10),
        serverSelectionTimeoutMS: getNumberEnv(
          'MONGODB_SERVER_SELECTION_TIMEOUT',
          5000
        ),
        socketTimeoutMS: getNumberEnv('MONGODB_SOCKET_TIMEOUT', 45000),
      },
    },
  },

  // Redis
  redis: {
    host: requireEnv('REDIS_HOST'),
    port: getNumberEnv('REDIS_PORT', 6379),
  },

  // admin credentials
  admin: {
    username: getEnv('SETUP_AUTH_USERNAME', 'admin'),
    password: getEnv('SETUP_AUTH_PASSWORD', 'password'),
  },

  // AWS
  aws: {
    region: requireEnv('AWS_REGION'),
    accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
    s3: {
      bucketName: requireEnv('AWS_S3_BUCKET_NAME'),
      region: getEnv('AWS_S3_REGION', process.env.AWS_REGION),
    },
    ses: {
      region: getEnv('AWS_SES_REGION', process.env.AWS_REGION),
      fromEmail: getEnv('AWS_SES_FROM_EMAIL'),
    },
  },

  // JWT
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m') || '15m',
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '30d') || '30d',
    algorithm: getEnv('JWT_ALGORITHM', 'HS256') || 'HS256',
    bcryptRounds: getNumberEnv('BCRYPT_ROUNDS', 12),
  },

  // GraphQL
  graphql: {
    path: getEnv('GRAPHQL_PATH', '/graphql'),
    playground: getBoolEnv('GRAPHQL_PLAYGROUND', false),
    introspection: getBoolEnv('GRAPHQL_INTROSPECTION', true),
  },

  // CORS
  cors: {
    allowedOrigins: getEnv(
      'ALLOWED_ORIGINS',
      'http://localhost:3000,http://localhost:5173'
    )?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: getBoolEnv('CORS_CREDENTIALS', true),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: getNumberEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    max: getNumberEnv('RATE_LIMIT_MAX', 100), // limit each IP to 100 requests per windowMs
    message: getEnv(
      'RATE_LIMIT_MESSAGE',
      'Too many requests from this IP, please try again later.'
    ),
  },

  // Logging
  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    format: getEnv('LOG_FORMAT', 'json'),
    enableConsole: getBoolEnv('LOG_ENABLE_CONSOLE', true),
    enableFile: getBoolEnv('LOG_ENABLE_FILE', false),
    logFile: getEnv('LOG_FILE', 'logs/app.log'),
  },

  // Security
  security: {
    bcryptRounds: getNumberEnv('BCRYPT_ROUNDS', 12),
    sessionSecret: getEnv('SESSION_SECRET', 'your-session-secret'),
  },

  // File Upload
  upload: {
    maxFileSize: getNumberEnv('MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
    allowedMimeTypes: getEnv(
      'ALLOWED_MIME_TYPES',
      'image/jpeg,image/png,image/gif,application/pdf'
    )?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ],
    uploadDir: getEnv('UPLOAD_DIR', 'uploads'),
  },

  // Socket.IO
  socket: {
    cors: {
      origin: getEnv('SOCKET_CORS_ORIGIN', 'http://localhost:3000'),
      credentials: getBoolEnv('SOCKET_CORS_CREDENTIALS', true),
    },
    pingTimeout: getNumberEnv('SOCKET_PING_TIMEOUT', 60000),
    pingInterval: getNumberEnv('SOCKET_PING_INTERVAL', 25000),
  },

  // Health Check
  health: {
    enabled: getBoolEnv('HEALTH_CHECK_ENABLED', true),
    path: getEnv('HEALTH_CHECK_PATH', '/health'),
  },
};

export type AppConfig = typeof config;
export type DatabaseConfig = typeof config.database;
export type RedisConfig = typeof config.redis;
export type AWSConfig = typeof config.aws;
export type JWTConfig = typeof config.jwt;
export type GraphQLConfig = typeof config.graphql;
export type CORSConfig = typeof config.cors;
export type RateLimitConfig = typeof config.rateLimit;
export type LoggingConfig = typeof config.logging;
export type SecurityConfig = typeof config.security;
export type UploadConfig = typeof config.upload;
export type SocketConfig = typeof config.socket;
export type HealthConfig = typeof config.health;

export const appConfig = config.app;
export const databaseConfig = config.database;
export const redisConfig = config.redis;
export const awsConfig = config.aws;
export const jwtConfig = config.jwt;
export const graphqlConfig = config.graphql;
export const corsConfig = config.cors;
export const rateLimitConfig = config.rateLimit;
export const loggingConfig = config.logging;
export const securityConfig = config.security;
export const uploadConfig = config.upload;
export const socketConfig = config.socket;
export const healthConfig = config.health;

export default config;
