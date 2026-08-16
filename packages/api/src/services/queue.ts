import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import pino from 'pino';

export class JobQueue {
  private redis: Redis;
  private logger: pino.Logger;
  private app: FastifyInstance;
  private running = false;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.redis = app.redis;
    this.logger = app.logger.child({ module: 'job-queue' });
  }

  async start() {
    if (this.running) return;
    this.running = true;

    this.logger.info('Starting job queue worker');

    // Listen for jobs on different queues
    this.listenQueue('jobs:ingest', this.processIngest.bind(this));
    this.listenQueue('jobs:generate', this.processGenerate.bind(this));
    this.listenQueue('jobs:render', this.processRender.bind(this));
    this.listenQueue('jobs:poster', this.processPoster.bind(this));
  }

  private listenQueue(queueName: string, handler: (job: any) => Promise<void>) {
    this.redis.on('connect', async () => {
      this.logger.info(`Listening on queue: ${queueName}`);

      while (this.running) {
        try {
          // Use BRPOP with timeout for blocking pop
          const result = await this.redis.brpop(queueName, 5);

          if (result) {
            const [, jobData] = result;
            const job = JSON.parse(jobData);
            this.logger.info({ jobId: job.id, type: job.type }, 'Processing job');

            await this.processJob(job, handler);
          }
        } catch (error) {
          this.logger.error({ error }, `Error processing ${queueName}`);
          await this.delay(1000);
        }
      }
    });
  }

  private async processJob(job: any, handler: (job: any) => Promise<void>) {
    try {
      // Mark as processing
      await this.app.pg.query(
        'UPDATE jobs SET status = $1, updated_at = $2 WHERE id = $3',
        ['processing', new Date().toISOString(), job.id]
      );

      await handler(job);

      // Mark as completed
      await this.app.pg.query(
        'UPDATE jobs SET status = $1, updated_at = $2 WHERE id = $3',
        ['completed', new Date().toISOString(), job.id]
      );

      this.logger.info({ jobId: job.id }, 'Job completed');
    } catch (error) {
      this.logger.error({ error, jobId: job.id }, 'Job failed');

      await this.app.pg.query(
        'UPDATE jobs SET status = $1, error = $2, updated_at = $3 WHERE id = $4',
        ['failed', (error as Error).message, new Date().toISOString(), job.id]
      );
    }
  }

  private async processIngest(job: any) {
    // Import here to avoid circular dependency
    const { IngestWorker } = await import('../services/ingest-worker');
    const worker = new IngestWorker(this.app);
    await worker.process(job);
  }

  private async processGenerate(job: any) {
    const { GeneratorWorker } = await import('../services/generator-worker');
    const worker = new GeneratorWorker(this.app);
    await worker.process(job);
  }

  private async processRender(job: any) {
    const { RenderWorker } = await import('../services/render-worker');
    const worker = new RenderWorker(this.app);
    await worker.process(job);
  }

  private async processPoster(job: any) {
    const { PosterWorker } = await import('../services/poster-worker');
    const worker = new PosterWorker(this.app);
    await worker.process(job);
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
