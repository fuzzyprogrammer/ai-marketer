import { FastifyInstance } from 'fastify';
import { JobQueue } from '../services/queue';

export function startWorkers(app: FastifyInstance) {
  const logger = app.logger.child({ module: 'workers' });

  // Start the main worker loop
  const queue = new JobQueue(app);
  queue.start();

  logger.info('Workers started');
}
