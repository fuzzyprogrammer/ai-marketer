import Redis from 'ioredis';
import pino from 'pino';

export class RenderAgent {
  private redis: Redis;
  private logger: pino.Logger;
  private running = false;

  constructor(redis: Redis, logger: pino.Logger) {
    this.redis = redis;
    this.logger = logger.child({ module: 'render-agent' });
  }

  start() {
    this.running = true;
    this.logger.info('Render agent started');
    this.listen();
  }

  stop() {
    this.running = false;
    this.logger.info('Render agent stopped');
  }

  private async listen() {
    const subscription = this.redis.subscribe('worker:render:tasks');
    this.logger.info('Render agent listening for tasks');

    this.redis.on('message', async (channel, message) => {
      if (channel === 'worker:render:tasks' && this.running) {
        try {
          const job = JSON.parse(message);
          this.logger.info({ jobId: job.id }, 'Processing render job');

          await fetch(`${process.env.API_URL || 'http://localhost:4000'}/api/jobs/${job.id}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'render', data: job.data }),
          });

          this.logger.info({ jobId: job.id }, 'Render job completed');
        } catch (error) {
          this.logger.error({ error }, 'Error processing render job');
        }
      }
    });
  }
}
