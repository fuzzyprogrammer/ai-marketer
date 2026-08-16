import { FastifyInstance } from 'fastify';

export async function adminController(app: FastifyInstance) {
  // GET /api/admin/stats
  app.get('/stats', async (request, reply) => {
    const logger = app.logger.child({ module: 'admin-stats' });

    try {
      const client = await app.pg.connect();

      const brandsCount = await client.query('SELECT COUNT(*) FROM brands');
      const jobsCount = await client.query('SELECT COUNT(*) FROM jobs');
      const pendingJobs = await client.query("SELECT COUNT(*) FROM jobs WHERE status = 'pending'");
      const completedJobs = await client.query("SELECT COUNT(*) FROM jobs WHERE status = 'completed'");

      client.release();

      return reply.send({
        brands: parseInt(brandsCount.rows[0].count),
        totalJobs: parseInt(jobsCount.rows[0].count),
        pendingJobs: parseInt(pendingJobs.rows[0].count),
        completedJobs: parseInt(completedJobs.rows[0].count),
      });
    } catch (error) {
      logger.error(error, 'Failed to get stats');
      return reply.code(500).send({ error: 'Failed to get stats' });
    }
  });

  // GET /api/admin/queue
  app.get('/queue', async (request, reply) => {
    const logger = app.logger.child({ module: 'admin-queue' });

    try {
      const queues = ['jobs:ingest', 'jobs:generate', 'jobs:render', 'jobs:poster'];
      const stats: any[] = [];

      for (const queue of queues) {
        const length = await app.redis.llen(queue);
        stats.push({ queue, length });
      }

      return reply.send(stats);
    } catch (error) {
      logger.error(error, 'Failed to get queue stats');
      return reply.code(500).send({ error: 'Failed to get queue stats' });
    }
  });
}
