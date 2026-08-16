import Redis from 'ioredis';
import axios from 'axios';
import pino from 'pino';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const PLATFORMS = ['twitter', 'pinterest', 'youtube', 'instagram'];

async function processJob(jobData: string) {
  const job = JSON.parse(jobData);
  logger.info({ jobId: job.id }, 'Processing poster job');

  const { brandId, postId, channels = PLATFORMS } = job;

  // Fetch content
  let content: any;
  try {
    const response = await axios.get(`${process.env.API_URL || 'http://localhost:4000'}/api/content/${postId}`);
    content = response.data;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch content');
    await markFailed(job.id, 'Failed to fetch content');
    return;
  }

  // Post to each channel (simulated)
  const results = [];
  for (const channel of channels) {
    try {
      logger.info({ channel, brandId }, 'Posting to channel');

      // Simulate posting
      await new Promise(resolve => setTimeout(resolve, 1000));

      results.push({
        channel,
        status: 'success',
        platformPostId: `sim-${Date.now()}`,
        postedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ channel, error }, 'Failed to post to channel');
      results.push({
        channel,
        status: 'failed',
        error: (error as Error).message,
      });
    }
  }

  await markCompleted(job.id, results);
  logger.info({ brandId, results: results.length }, 'Poster job complete');
}

async function markCompleted(jobId: string, results?: any[]) {
  await axios.put(`${process.env.API_URL || 'http://localhost:4000'}/api/jobs/${jobId}/status`, {
    status: 'completed',
    result: results,
    updated_at: new Date().toISOString(),
  });
}

async function markFailed(jobId: string, error: string) {
  await axios.put(`${process.env.API_URL || 'http://localhost:4000'}/api/jobs/${jobId}/status`, {
    status: 'failed',
    error,
    updated_at: new Date().toISOString(),
  });
}

async function start() {
  logger.info('Poster worker started');

  while (true) {
    try {
      const result = await redis.brpop('jobs:poster', 5);
      if (result) {
        const [, jobData] = result;
        await processJob(jobData);
      }
    } catch (error) {
      logger.error({ error }, 'Error in poster worker loop');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

start().catch(console.error);
