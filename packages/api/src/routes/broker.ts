import { FastifyInstance } from 'fastify';

export async function brokerController(app: FastifyInstance) {
  // Proxy to broker service
  const BROKER_URL = process.env.BROKER_URL || 'http://localhost:3000';

  app.post('/generate', async (request, reply) => {
    const logger = app.logger.child({ module: 'broker-generate' });
    const { model, type, prompt, brandId, maxTokens, mode } = request.body as any;

    try {
      const response = await app.inject({
        method: 'POST',
        url: `${BROKER_URL}/v1/generate`,
        payload: { model, type, prompt, brandId, maxTokens, mode },
      });

      return reply.send(response.json());
    } catch (error) {
      logger.error(error, 'Broker request failed');
      return reply.code(502).send({ error: 'Broker service unavailable' });
    }
  });

  app.get('/usage', async (request, reply) => {
    const logger = app.logger.child({ module: 'broker-usage' });
    const { brandId, provider } = request.query as any;

    try {
      const response = await app.inject({
        method: 'GET',
        url: `${BROKER_URL}/v1/usage?brandId=${brandId}&provider=${provider}`,
      });

      return reply.send(response.json());
    } catch (error) {
      logger.error(error, 'Failed to get usage');
      return reply.code(502).send({ error: 'Broker service unavailable' });
    }
  });
}
