import Redis from 'ioredis';
import pino from 'pino';

export class IngestAgent {
  private redis: Redis;
  private logger: pino.Logger;
  private running = false;

  constructor(redis: Redis, logger: pino.Logger) {
    this.redis = redis;
    this.logger = logger.child({ module: 'ingest-agent' });
  }

  start() {
    this.running = true;
    this.logger.info('Ingest agent started');
    this.listen();
  }

  stop() {
    this.running = false;
    this.logger.info('Ingest agent stopped');
  }

  private async listen() {
    const subscription = this.redis.subscribe('worker:ingest:tasks');
    this.logger.info('Ingest agent listening for tasks');

    this.redis.on('message', async (channel, message) => {
      if (channel === 'worker:ingest:tasks' && this.running) {
        try {
          const job = JSON.parse(message);
          this.logger.info({ jobId: job.id }, 'Processing ingest job');

          // Process job via API
          await fetch(`${process.env.API_URL || 'http://localhost:4000'}/api/jobs/${job.id}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'ingest', data: job.data }),
          });

          this.logger.info({ jobId: job.id }, 'Ingest job completed');
        } catch (error) {
          this.logger.error({ error }, 'Error processing ingest job');
        }
      }
    });
  }
}
