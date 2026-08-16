import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const importSchema = z.object({
  sourceUrl: z.string().url().optional(),
  files: z.array(z.object({
    name: z.string(),
    content: z.string(),
  })).optional(),
  manualData: z.record(z.string(), z.any()).optional(),
});

const importResponseSchema = z.object({
  jobId: z.string(),
  status: z.string(),
  message: z.string(),
});

export async function brandsController(app: FastifyInstance) {
  // POST /api/brands/import
  app.post('/import', {
    schema: {
      body: importSchema,
      response: {
        200: importResponseSchema,
        400: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const body = importSchema.parse(request.body);
    const logger = app.logger.child({ module: 'brands-import' });

    try {
      // Create import job
      const job = await app.redis.lpush(
        'jobs:ingest',
        JSON.stringify({
          id: require('uuid').v4(),
          type: 'ingest',
          data: body,
          createdAt: new Date().toISOString(),
          status: 'pending',
        })
      );

      logger.info({ jobId: job }, 'Brand import job created');

      return reply.code(200).send({
        jobId: job,
        status: 'pending',
        message: 'Brand import job created successfully',
      });
    } catch (error) {
      logger.error(error, 'Failed to create import job');
      return reply.code(500).send({ error: 'Failed to create import job' });
    }
  });

  // GET /api/brands/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const logger = app.logger.child({ module: 'brands-get', brandId: id });

    try {
      const client = await app.pg.connect();
      const result = await client.query(
        'SELECT * FROM brands WHERE id = $1',
        [id]
      );
      client.release();

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Brand not found' });
      }

      return reply.send(result.rows[0]);
    } catch (error) {
      logger.error(error, 'Failed to fetch brand');
      return reply.code(500).send({ error: 'Failed to fetch brand' });
    }
  });

  // GET /api/brands
  app.get('/', async (request, reply) => {
    const logger = app.logger.child({ module: 'brands-list' });

    try {
      const client = await app.pg.connect();
      const result = await client.query('SELECT * FROM brands ORDER BY created_at DESC');
      client.release();

      return reply.send(result.rows);
    } catch (error) {
      logger.error(error, 'Failed to list brands');
      return reply.code(500).send({ error: 'Failed to list brands' });
    }
  });
}
