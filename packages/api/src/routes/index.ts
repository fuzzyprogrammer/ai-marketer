import { FastifyInstance } from 'fastify';
import { brandsController } from './routes/brands';
import { jobsController } from './routes/jobs';
import { brokerController } from './routes/broker';
import { adminController } from './routes/admin';

export async function registerRoutes(app: FastifyInstance) {
  // Brand management
  await app.register(brandsController, { prefix: '/api/brands' });

  // Job management
  await app.register(jobsController, { prefix: '/api/jobs' });

  // Broker proxy
  await app.register(brokerController, { prefix: '/api/broker' });

  // Admin endpoints
  await app.register(adminController, { prefix: '/api/admin' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
}
