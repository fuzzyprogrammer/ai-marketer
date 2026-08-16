import express from 'express';
import Redis from 'ioredis';
import pino from 'pino';
import { OmniRouteAdapter } from './adapters/omniroute';
import { AdapterInterface } from './types/adapter';
import { CompressionPipeline } from './pipeline/compression';
import { TokenCache } from './cache/token-cache';
import { QuotaManager } from './quota/manager';

const app = express();
app.use(express.json());

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const omniRouteUrl = process.env.OMNIROUTE_URL || 'http://localhost:20128';

// Initialize components
const adapters: Map<string, AdapterInterface> = new Map();
adapters.set('omniroute', new OmniRouteAdapter(omniRouteUrl, logger));
adapters.set('gemini', null as any); // TODO: Add Gemini adapter
adapters.set('nvidia', null as any); // TODO: Add NVIDIA adapter

const compressionPipeline = new CompressionPipeline();
const tokenCache = new TokenCache(redis);
const quotaManager = new QuotaManager(redis, logger);

// POST /v1/generate
app.post('/v1/generate', async (req, res) => {
  const logger = pino.child({ module: 'broker-generate' });

  try {
    const { model = 'auto', type, prompt, brandId, maxTokens = 500, mode = 'production' } = req.body;

    // Check cache
    const cacheKey = `${brandId}:${type}:${prompt.substring(0, 100)}`;
    const cached = await tokenCache.get(cacheKey);
    if (cached) {
      logger.info({ cacheKey }, 'Cache hit');
      return res.json({
        id: cached.id,
        output: cached.output,
        tokensUsed: cached.tokensUsed,
        cached: true,
        'X-Cache-Hit': 'true',
      });
    }

    // Select adapter based on model
    const adapter = selectAdapter(model, brandId);
    if (!adapter) {
      return res.status(400).json({ error: 'No available adapter for model' });
    }

    // Apply compression
    const compressedPrompt = await compressionPipeline.compress(prompt, {
      brandId,
      type,
      maxTokens,
    });

    // Check quota
    const quotaOk = await quotaManager.checkQuota(brandId, adapter.getName());
    if (!quotaOk) {
      return res.status(429).json({ error: 'Daily token quota exceeded' });
    }

    // Call adapter
    const result = await adapter.generate({
      type,
      prompt: compressedPrompt,
      maxTokens,
      mode,
    });

    // Update quota
    await quotaManager.recordUsage(brandId, adapter.getName(), result.tokensUsed);

    // Cache result
    await tokenCache.set(cacheKey, result);

    // Return response with telemetry headers
    const response = {
      id: result.id,
      output: result.output,
      tokensUsed: result.tokensUsed,
      provider: adapter.getName(),
      'X-Decision': JSON.stringify({
        provider: adapter.getName(),
        model: model,
        strategy: 'cache-optimized',
      }),
      'X-Tokens-Used': result.tokensUsed.toString(),
      'X-Cache-Hit': 'false',
    };

    logger.info({ brandId, provider: adapter.getName(), tokens: result.tokensUsed }, 'Generation complete');
    res.json(response);
  } catch (error) {
    logger.error({ error }, 'Generation failed');
    res.status(500).json({ error: 'Generation failed' });
  }
});

// GET /v1/usage
app.get('/v1/usage', async (req, res) => {
  const { brandId, provider } = req.query;

  try {
    const usage = await quotaManager.getUsage(brandId as string, provider as string);
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

// GET /v1/providers
app.get('/v1/providers', async (_req, res) => {
  const providers = Array.from(adapters.entries()).map(([name, adapter]) => ({
    name,
    available: adapter !== null,
  }));
  res.json(providers);
});

function selectAdapter(model: string, brandId: string): AdapterInterface | null {
  if (model === 'auto') {
    // Use quota-aware routing
    return quotaManager.selectBestProvider(brandId, adapters);
  }
  return adapters.get(model) || null;
}

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  logger.info(`Broker service running on port ${PORT}`);
});
