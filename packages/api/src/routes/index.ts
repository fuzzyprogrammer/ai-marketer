import { FastifyInstance } from 'fastify';
import { brandsController } from './brands';
import { jobsController } from './jobs';
import { brokerController } from './broker';
import { adminController } from './admin';
import { redirectsController } from './redirects';
import { analyticsController } from './analytics';
import { skillsController } from './skills';
import { contentController } from './content';

export async function registerRoutes(app: FastifyInstance) {
  // Brand management
  await app.register(brandsController, { prefix: '/api/brands' });

  // Job management
  await app.register(jobsController, { prefix: '/api/jobs' });

  // Broker proxy
  await app.register(brokerController, { prefix: '/api/broker' });

  // Admin endpoints
  await app.register(adminController, { prefix: '/api/admin' });

  // Skills
  await app.register(skillsController, { prefix: '/api/skills' });

  // Redirect routes
  await app.register(redirectsController, { prefix: '/r' });

  // Analytics routes
  await app.register(analyticsController, { prefix: '/api/analytics' });

  // Content drafts
  await app.register(contentController, { prefix: '/api/content' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Detailed health check
  app.get('/health/detailed', async () => {
    const redisStatus = await checkRedisHealth();
    const postgresStatus = await checkPostgresHealth();
    const minioStatus = await checkMinioHealth();
    const omnirouteStatus = await checkOmnirouteHealth();
    const brokerStatus = await checkBrokerHealth();
    const renderWorkerStatus = await checkWorkerHealth('render-worker');
    const posterWorkerStatus = await checkWorkerHealth('poster-worker');

    const uptime = Math.floor(process.uptime());
    const memoryUsage = `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`;

    const status = postgresStatus === 'up' && redisStatus === 'up' && minioStatus === 'up' && omnirouteStatus === 'up' && brokerStatus === 'up' && renderWorkerStatus.status === 'up' && posterWorkerStatus.status === 'up'
      ? 'healthy' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      services: {
        postgres: postgresStatus,
        redis: redisStatus,
        minio: minioStatus,
        omniroute: omnirouteStatus,
        api: 'up',
        broker: brokerStatus,
        'render-worker': renderWorkerStatus.status,
        'poster-worker': posterWorkerStatus.status,
      },
      metrics: {
        uptime,
        memory_usage: memoryUsage,
        event_loop_lag: Number(process.hrtime.bigint()) % 100,
      },
      version: process.env.npm_package_version || '0.1.0',
    };
  });

  // Prometheus-compatible metrics endpoint
  app.get('/metrics', async () => {
    const uptime = Math.floor(process.uptime());

    return {
      fastify_prometheus_nodejs_metrics_process_start_time_seconds: process.hrtime.bigint() / 1e9 - uptime,
      fastify_prometheus_nodejs_metrics_uptime_seconds: uptime,
      ai_marketer_active_brands: 0,
      ai_marketer_queues_size: await getQueueSizes(),
      ai_marketer_api_requests_total: app.res.stats?.requests || 0,
      ai_marketer_api_errors_total: app.res.stats?.errors || 0,
    };
  });
}

async function checkRedisHealth(): Promise<'up' | 'down' | 'warning'> {
  try {
    await redis.ping();
    return 'up';
  } catch {
    return 'down';
  }
}

async function checkPostgresHealth(): Promise<'up' | 'down' | 'warning'> {
  try {
    const client = await pgPool.connect();
    try {
      await client.query('SELECT 1');
      return 'up';
    } finally {
      client.release();
    }
  } catch {
    return 'down';
  }
}

async function checkMinioHealth(): Promise<'up' | 'down' | 'warning'> {
  try {
    const buckets = await minioClient.listBuckets();
    if (buckets?.length > 0) {
      return 'up';
    }
    return 'warning';
  } catch {
    return 'down';
  }
}

async function checkOmnirouteHealth(): Promise<'up' | 'down' | 'warning'> {
  try {
    const omniRouteUrl = process.env.OMNIROUTE_URL || 'http://localhost:20128';
    const response = await fetch(`${omniRouteUrl}/health`);
    if (response.ok) {
      return 'up';
    }
    return 'down';
  } catch {
    return 'down';
  }
}

async function checkBrokerHealth(): Promise<'up' | 'down'> {
  try {
    const brokerUrl = process.env.BROKER_URL || 'http://localhost:3000';
    const response = await fetch(`${brokerUrl}/health`);
    if (response.ok) {
      return 'up';
    }
    return 'down';
  } catch {
    return 'down';
  }
}

function checkWorkerHealth(workerName: string): { status: 'up' | 'down'; lastHeartbeat: string; memoryUsage: string; uptime: number } {
  const redis = require('ioredis');
  const client = new redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const heartbeatKey = `worker:heartbeat:${workerName}`;

  try {
    const lastHeartbeat = client.getSync(heartbeatKey);
    const now = Date.now();
    const heartbeatTime = lastHeartbeat ? new Date(Number(lastHeartbeat)).getTime() : now;
    const timeSinceHeartbeat = now - heartbeatTime;
    const isHealthy = timeSinceHeartbeat < 30000; // 30 seconds

    return {
      status: isHealthy ? 'up' : 'down',
      lastHeartbeat: new Date(lastHeartbeat || now).toISOString(),
      memoryUsage: 'N/A',
      uptime: Math.floor(process.uptime()),
    };
  } catch {
    return {
      status: 'down',
      lastHeartbeat: new Date().toISOString(),
      memoryUsage: 'N/A',
      uptime: 0,
    };
  }
}

async function getQueueSizes(): Promise<Record<string, number>> {
  const queues = ['jobs:ingest', 'jobs:generate', 'jobs:render', 'jobs:poster'];
  const sizes: Record<string, number> = {};

  for (const queue of queues) {
    try {
      sizes[queue] = await redis.llen(queue);
    } catch {
      sizes[queue] = 0;
    }
  }

  return sizes;
}