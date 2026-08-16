import Redis from 'ioredis';
import axios from 'axios';
import pino from 'pino';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const PROMPT_TEMPLATES = {
  social_post: (brand: any) => `Create an engaging social media post for ${brand.name}. ${brand.short_description}. Tone: ${brand.tone || 'professional'}. Audience: ${brand.audience?.join(', ') || 'general'}. Include a call-to-action.`,
  blog_outline: (brand: any) => `Create a blog article outline for ${brand.name}. Products: ${brand.key_products?.join(', ') || 'various'}. Include sections and key points.`,
  hashtags: (brand: any) => `Generate 10-15 relevant hashtags for ${brand.name} (${brand.short_description}). Categories: ${brand.categories?.join(', ') || 'general'}.`,
};

async function processJob(jobData: string) {
  const job = JSON.parse(jobData);
  logger.info({ jobId: job.id }, 'Processing generation job');

  const { brandId } = job;

  // Fetch brand profile
  let brand: any;
  try {
    const response = await axios.get(`${process.env.API_URL || 'http://localhost:4000'}/api/brands/${brandId}`);
    brand = response.data;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch brand');
    await markFailed(job.id, 'Failed to fetch brand');
    return;
  }

  // Generate content for each type
  const contentTypes = Object.keys(PROMPT_TEMPLATES);
  const results = [];

  for (const type of contentTypes) {
    try {
      const prompt = PROMPT_TEMPLATES[type](brand);
      const response = await axios.post(`${process.env.BROKER_URL || 'http://localhost:3000'}/v1/generate`, {
        model: 'auto',
        type: 'text',
        prompt,
        brandId,
        maxTokens: 500,
        mode: 'production',
      });

      const result = response.data;
      results.push({ type, content: result.output, tokensUsed: result.tokensUsed });

      // Store draft
      await axios.post(`${process.env.API_URL || 'http://localhost:4000'}/api/content/drafts`, {
        brand_id: brandId,
        type,
        content: result.output,
        metadata: { tokensUsed: result.tokensUsed, provider: result.provider },
      });
    } catch (error) {
      logger.error({ type, error }, 'Failed to generate content type');
    }
  }

  await markCompleted(job.id, results);
  logger.info({ brandId, results: results.length }, 'Generation complete');
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
  logger.info('Generator worker started');

  while (true) {
    try {
      const result = await redis.brpop('jobs:generate', 5);
      if (result) {
        const [, jobData] = result;
        await processJob(jobData);
      }
    } catch (error) {
      logger.error({ error }, 'Error in generator worker loop');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

start().catch(console.error);
