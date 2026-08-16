import { FastifyInstance } from 'fastify';
import axios from 'axios';

export class IngestWorker {
  private app: FastifyInstance;

  constructor(app: FastifyInstance) {
    this.app = app;
  }

  async process(job: any) {
    const logger = this.app.logger.child({ module: 'ingest-worker', jobId: job.id });
    logger.info('Processing ingest job');

    const { sourceUrl, files, manualData } = job.data;

    let brandProfile: any = {
      id: job.id,
      name: '',
      short_description: '',
      long_description: '',
      categories: [],
      tone: '',
      audience: [],
      website_url: sourceUrl || '',
      logo_url: '',
      key_products: [],
      canonical_pages: [],
      contact_email: '',
      extracted_keywords: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Fetch content from URL or use provided files
    if (sourceUrl) {
      try {
        const response = await axios.get(sourceUrl, { timeout: 30000 });
        const content = this.extractContent(response.data);
        brandProfile.long_description = content;
      } catch (error) {
        logger.error({ error }, 'Failed to fetch URL');
        throw error;
      }
    }

    // Process uploaded files
    if (files && files.length > 0) {
      const fileContents = files.map(f => f.content).join('\n');
      brandProfile.long_description = fileContents;
    }

    // Process manual data
    if (manualData) {
      brandProfile = { ...brandProfile, ...manualData };
    }

    // Store in database
    const client = await this.app.pg.connect();
    try {
      await client.query(
        `INSERT INTO brands (id, name, short_description, long_description, categories, tone, audience, website_url, logo_url, key_products, canonical_pages, contact_email, extracted_keywords, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET
           short_description = EXCLUDED.short_description,
           long_description = EXCLUDED.long_description,
           updated_at = EXCLUDED.updated_at`,
        [
          brandProfile.id,
          brandProfile.name,
          brandProfile.short_description,
          brandProfile.long_description,
          JSON.stringify(brandProfile.categories),
          brandProfile.tone,
          JSON.stringify(brandProfile.audience),
          brandProfile.website_url,
          brandProfile.logo_url,
          JSON.stringify(brandProfile.key_products),
          JSON.stringify(brandProfile.canonical_pages),
          brandProfile.contact_email,
          JSON.stringify(brandProfile.extracted_keywords),
          brandProfile.created_at,
          brandProfile.updated_at,
        ]
      );

      logger.info({ brandId: brandProfile.id }, 'Brand profile stored');
    } finally {
      client.release();
    }

    // Enqueue generation job
    await this.app.redis.lpush(
      'jobs:generate',
      JSON.stringify({
        id: `gen-${job.id}-${Date.now()}`,
        type: 'generate',
        brandId: brandProfile.id,
        data: { source: 'ingest' },
        createdAt: new Date().toISOString(),
        status: 'pending',
      })
    );

    logger.info({ brandId: brandProfile.id }, 'Generated content queued');
  }

  private extractContent(html: string): string {
    // Simple text extraction (in production, use Readability.js or similar)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.substring(0, 10000); // Limit content length
  }
}
