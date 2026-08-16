import Redis from 'ioredis';
import axios from 'axios';
import pino from 'pino';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function processJob(jobData: string) {
  const job = JSON.parse(jobData);
  logger.info({ jobId: job.id }, 'Processing ingest job');

  const { sourceUrl, files, manualData } = job.data;
  let content = '';

  if (sourceUrl) {
    try {
      const response = await axios.get(sourceUrl, { timeout: 30000 });
      content = extractText(response.data);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch URL');
      await markFailed(job.id, 'Failed to fetch source URL');
      return;
    }
  }

  if (files) {
    content = files.map((f: any) => f.content).join('\n');
  }

  // Store brand profile via API
  const brandProfile = {
    id: job.id,
    name: manualData?.name || `Brand-${job.id}`,
    short_description: manualData?.short_description || extractShortDescription(content),
    long_description: content,
    website_url: sourceUrl || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await axios.post(`${process.env.API_URL || 'http://localhost:4000'}/api/brands`, brandProfile);
    logger.info({ brandId: job.id }, 'Brand profile stored');

    // Queue generation job
    await redis.lpush('jobs:generate', JSON.stringify({
      id: `gen-${job.id}-${Date.now()}`,
      type: 'generate',
      brandId: job.id,
      data: { source: 'ingest' },
      createdAt: new Date().toISOString(),
      status: 'pending',
    }));

    await markCompleted(job.id);
  } catch (error) {
    logger.error({ error }, 'Failed to store brand');
    await markFailed(job.id, 'Failed to store brand profile');
  }
}

function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000);
}

function extractShortDescription(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences[0]?.trim().substring(0, 150) + '...' || text.substring(0, 150) + '...';
}

async function markCompleted(jobId: string) {
  await axios.put(`${process.env.API_URL || 'http://localhost:4000'}/api/jobs/${jobId}/status`, {
    status: 'completed',
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

// Start polling for jobs
async function start() {
  logger.info('Ingest worker started');

  while (true) {
    try {
      const result = await redis.brpop('jobs:ingest', 5);
      if (result) {
        const [, jobData] = result;
        await processJob(jobData);
      }
    } catch (error) {
      logger.error({ error }, 'Error in ingest worker loop');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

start().catch(console.error);
