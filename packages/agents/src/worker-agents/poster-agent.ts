import Redis from 'ioredis';
import pino from 'pino';

export class PosterAgent {
  private redis: Redis;
  private logger: pino.Logger;
  private running = false;

  constructor(redis: Redis, logger: pino.Logger) {
    this.redis = redis;
    this.logger = logger.child({ module: 'poster-agent' });
  }

  start() {
    this.running = true;
    this.logger.info('Poster agent started');
    this.listen();
  }

  stop() {
    this.running = false;
    this.logger.info('Poster agent stopped');
  }

  private async listen() {
    const subscription = this.redis.subscribe('worker:poster:tasks');
    this.logger.info('Poster agent listening for tasks');

    this.redis.on('message', async (channel, message) => {
      if (channel === 'worker:poster:tasks' && this.running) {
        try {
          const job = JSON.parse(message);
          this.logger.info({ jobId: job.id }, 'Processing poster job');

          await fetch(`${process.env.API_URL || 'http://localhost:4000'}/api/jobs/${job.id}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'poster', data: job.data }),
          });

          this.logger.info({ jobId: job.id }, 'Poster job completed');
        } catch (error) {
          this.logger.error({ error }, 'Error processing poster job');
        }
      }
    });
  }
}
