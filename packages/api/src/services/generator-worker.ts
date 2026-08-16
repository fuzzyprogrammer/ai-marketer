import { FastifyInstance } from 'fastify';

export class GeneratorWorker {
  private app: FastifyInstance;

  constructor(app: FastifyInstance) {
    this.app = app;
  }

  async process(job: any) {
    const logger = this.app.logger.child({ module: 'generator-worker', jobId: job.id });
    logger.info('Processing generation job');

    const { brandId } = job;
    const { data } = job;

    // Fetch brand profile
    const client = await this.app.pg.connect();
    const brandResult = await client.query('SELECT * FROM brands WHERE id = $1', [brandId]);
    client.release();

    if (brandResult.rows.length === 0) {
      logger.error({ brandId }, 'Brand not found');
      throw new Error(`Brand ${brandId} not found`);
    }

    const brand = brandResult.rows[0];

    // Generate content types
    const contentTypes = ['social_post', 'blog_outline', 'hashtag_set'];
    const results = [];

    for (const contentType of contentTypes) {
      try {
        const prompt = this.buildPrompt(contentType, brand, data);
        const result = await this.callBroker(prompt, brandId, contentType);
        results.push(result);
      } catch (error) {
        logger.error({ contentType, error }, 'Failed to generate content type');
      }
    }

    // Store results
    for (const result of results) {
      await this.storeDraft(result);
    }

    logger.info({ brandId, results: results.length }, 'Generation complete');
  }

  private buildPrompt(type: string, brand: any, data: any): string {
    const prompts: Record<string, string> = {
      social_post: `Create a social media post for ${brand.name} (${brand.short_description}). Tone: ${brand.tone || 'professional'}. Target audience: ${brand.audience?.join(', ') || 'general'}. Make it engaging and include a call-to-action.`,
      blog_outline: `Create a blog article outline for ${brand.name}. Products: ${brand.key_products?.join(', ') || 'various'}. Target audience: ${brand.audience?.join(', ') || 'general'}. Include sections and key points.`,
      hashtag_set: `Generate relevant hashtags for ${brand.name} (${brand.short_description}). Categories: ${brand.categories?.join(', ') || 'general'}. Include 10-15 hashtags.`,
    };

    return prompts[type] || prompts.social_post;
  }

  private async callBroker(prompt: string, brandId: string, type: string) {
    const response = await this.app.inject({
      method: 'POST',
      url: '/api/broker/generate',
      payload: {
        model: 'auto',
        type: 'text',
        prompt,
        brandId,
        maxTokens: 500,
        mode: 'production',
      },
    });

    return {
      type,
      content: response.json()?.output,
      tokensUsed: response.json()?.tokensUsed,
      provider: response.json()?.providerDecisionHeader?.[0]?.provider || 'unknown',
      createdAt: new Date().toISOString(),
    };
  }

  private async storeDraft(result: any) {
    const client = await this.app.pg.connect();
    try {
      await client.query(
        `INSERT INTO content_drafts (id, brand_id, type, content, status, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          result.brandId,
          result.type,
          result.content,
          'draft',
          JSON.stringify({ tokensUsed: result.tokensUsed, provider: result.provider }),
          new Date().toISOString(),
        ]
      );
    } finally {
      client.release();
    }
  }
}
