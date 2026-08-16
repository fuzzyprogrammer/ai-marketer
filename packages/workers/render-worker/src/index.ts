import Redis from 'ioredis';
import pino from 'pino';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function processJob(jobData: string) {
  const job = JSON.parse(jobData);
  logger.info({ jobId: job.id }, 'Processing render job');

  const { brandId, composition } = job;

  // TODO: Implement Puppeteer + FFmpeg rendering
  // For now, simulate the render process
  logger.info({ brandId }, 'Rendering simulated');

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  logger.info({ brandId, jobId: job.id }, 'Render complete');
}

async function start() {
  logger.info('Render worker started');

  while (true) {
    try {
      const result = await redis.brpop('jobs:render', 5);
      if (result) {
        const [, jobData] = result;
        await processJob(jobData);
      }
    } catch (error) {
      logger.error({ error }, 'Error in render worker loop');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

start().catch(console.error);
