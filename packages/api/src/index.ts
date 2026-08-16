import Fastify from 'fastify';
import cors from 'fastify-cors';
import postgres from 'pg';
import Redis from 'ioredis';
import Minio from 'minio';
import pino from 'pino';
import { registerRoutes } from './routes';
import { initQueue } from './services/queue';
import { startWorkers } from './workers';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    streams: [
      {
        level: 'info',
        stream: process.stdout,
      },
    ],
  },
});

// Database connection
const pgPool = new postgres.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost',
  port: parseInt(process.env.MINIO_ENDPOINT?.split(':')[1] || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Initialize MinIO buckets
async function initBuckets() {
  const buckets = ['brands', 'content', 'media', 'templates'];
  for (const bucket of buckets) {
    const exists = await minioClient.bucketExists(bucket).catch(() => false);
    if (!exists) {
      await minioClient.makeBucket(bucket, 'us-east-1');
      logger.info(`Created bucket: ${bucket}`);
    }
  }
}

async function start() {
  try {
    await app.register(cors);
    await app.register(import('fastify-plugin'));

    // Attach dependencies
    app.decorate('pg', pgPool);
    app.decorate('redis', redis);
    app.decorate('minio', minioClient);
    app.decorate('logger', logger);

    // Initialize queues
    await initQueue(app);

    // Register routes
    await registerRoutes(app);

    // Initialize storage
    await initBuckets();

    // Start workers
    startWorkers(app);

    await app.listen({ port: parseInt(process.env.PORT || '4000'), host: '0.0.0.0' });
    logger.info(`API server running on port ${process.env.PORT || 4000}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();
