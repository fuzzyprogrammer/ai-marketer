import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const jobStatusSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  result: z.any().optional(),
  error: z.string().optional(),
});

export async function jobsController(app: FastifyInstance) {
  // GET /api/jobs - list jobs with optional filters
  app.get('/', async (request, reply) => {
    const { type, status, brandId } = request.query as any;
    const logger = app.logger.child({ module: 'jobs-list' });

    try {
      let query = 'SELECT * FROM jobs';
      const params: any[] = [];
      let conditionIndex = 1;

      const conditions: string[] = [];
      if (type) {
        conditions.push(`type = $${conditionIndex++}`);
        params.push(type);
      }
      if (status) {
        conditions.push(`status = $${conditionIndex++}`);
        params.push(status);
      }
      if (brandId) {
        conditions.push(`metadata->>'brandId' = $${conditionIndex++}`);
        params.push(brandId);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC LIMIT 50';

      const client = await app.pg.connect();
      const result = await client.query(query, params);
      client.release();

      return reply.send(result.rows);
    } catch (error) {
      logger.error(error, 'Failed to list jobs');
      return reply.code(500).send({ error: 'Failed to list jobs' });
    }
  });

  // GET /api/jobs/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const logger = app.logger.child({ module: 'jobs-get', jobId: id });

    try {
      const client = await app.pg.connect();
      const result = await client.query('SELECT * FROM jobs WHERE id = $1', [id]);
      client.release();

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Job not found' });
      }

      return reply.send(result.rows[0]);
    } catch (error) {
      logger.error(error, 'Failed to fetch job');
      return reply.code(500).send({ error: 'Failed to fetch job' });
    }
  });

  // POST /api/jobs/:id/cancel
  app.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const logger = app.logger.child({ module: 'jobs-cancel', jobId: id });

    try {
      const client = await app.pg.connect();

      // Check if job exists and is pending/processing
      const result = await client.query(
        'SELECT status FROM jobs WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        client.release();
        return reply.code(404).send({ error: 'Job not found' });
      }

      if (result.rows[0].status !== 'pending' && result.rows[0].status !== 'processing') {
        client.release();
        return reply.code(400).send({ error: 'Job cannot be cancelled' });
      }

      await client.query(
        'UPDATE jobs SET status = $1, updated_at = $2 WHERE id = $3',
        ['cancelled', new Date().toISOString(), id]
      );

      client.release();
      return reply.send({ id, status: 'cancelled' });
    } catch (error) {
      logger.error(error, 'Failed to cancel job');
      return reply.code(500).send({ error: 'Failed to cancel job' });
    }
  });
}
