import Redis from 'ioredis';
import pino from 'pino';

export class GeneratorAgent {
  private redis: Redis;
  private logger: pino.Logger;
  private running = false;

  constructor(redis: Redis, logger: pino.Logger) {
    this.redis = redis;
    this.logger = logger.child({ module: 'generator-agent' });
  }

  start() {
    this.running = true;
    this.logger.info('Generator agent started');
    this.listen();
  }

  stop() {
    this.running = false;
    this.logger.info('Generator agent stopped');
  }

  private async listen() {
    const subscription = this.redis.subscribe('worker:generate:tasks');
    this.logger.info('Generator agent listening for tasks');

    this.redis.on('message', async (channel, message) => {
      if (channel === 'worker:generate:tasks' && this.running) {
        try {
          const job = JSON.parse(message);
          this.logger.info({ jobId: job.id }, 'Processing generation job');

          await fetch(`${process.env.API_URL || 'http://localhost:4000'}/api/jobs/${job.id}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'generate', data: job.data }),
          });

          this.logger.info({ jobId: job.id }, 'Generation job completed');
        } catch (error) {
          this.logger.error({ error }, 'Error processing generation job');
        }
      }
    });
  }
}
