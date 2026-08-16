import Redis from 'ioredis';
import pino from 'pino';
import axios from 'axios';

export class MainAgentController {
  private redis: Redis;
  private logger: pino.Logger;
  private running = false;

  constructor(redis: Redis, logger: pino.Logger) {
    this.redis = redis;
    this.logger = logger.child({ module: 'main-agent-controller' });
  }

  async start() {
    this.running = true;
    this.logger.info('Main agent controller started');
    this.monitorJobs();
  }

  async stop() {
    this.running = false;
    this.logger.info('Main agent controller stopped');
  }

  private async monitorJobs() {
    while (this.running) {
      try {
        // Check for pending jobs
        const pendingJobs = await this.getPendingJobs();
        for (const job of pendingJobs) {
          await this.assignJob(job);
        }

        // Check for failed jobs
        const failedJobs = await this.getFailedJobs();
        for (const job of failedJobs) {
          await this.requeueJob(job);
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        this.logger.error({ error }, 'Error in job monitor');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  private async getPendingJobs() {
    const client = await this.redis.connect();
    try {
      const queues = ['jobs:ingest', 'jobs:generate', 'jobs:render', 'jobs:poster'];
      const pending: any[] = [];

      for (const queue of queues) {
        const jobs = await client.lrange(queue, 0, -1);
        for (const jobStr of jobs) {
          pending.push(JSON.parse(jobStr));
        }
      }

      return pending;
    } finally {
      client.disconnect();
    }
  }

  private async getFailedJobs() {
    try {
      const response = await axios.get(`${process.env.API_URL || 'http://localhost:4000'}/api/jobs`, {
        params: { status: 'failed' },
      });
      return response.data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to get failed jobs');
      return [];
    }
  }

  private async assignJob(job: any) {
    this.logger.info({ jobId: job.id, type: job.type }, 'Assigning job');

    // Route job to appropriate worker
    const workerMap: Record<string, string> = {
      ingest: 'ingest',
      generate: 'generate',
      render: 'render',
      poster: 'poster',
    };

    const worker = workerMap[job.type];
    if (worker) {
      // Notify worker via Redis
      await this.redis.publish(`worker:${worker}:tasks`, JSON.stringify(job));
      this.logger.info({ jobId: job.id, worker }, 'Job assigned');
    }
  }

  private async requeueJob(job: any) {
    this.logger.info({ jobId: job.id }, 'Requeuing failed job');

    // Increment retry count
    const retries = job.retries || 0;
    if (retries >= 3) {
      this.logger.warn({ jobId: job.id }, 'Max retries exceeded, marking as failed');
      return;
    }

    // Requeue with delay
    const delayedJob = {
      ...job,
      retries: retries + 1,
      lastError: job.error,
    };

    await this.redis.lpush(`jobs:${job.type}`, JSON.stringify(delayedJob));
    this.logger.info({ jobId: job.id, retries: retries + 1 }, 'Job requeued');
  }
}
