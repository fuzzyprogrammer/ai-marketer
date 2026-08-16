import Redis from 'ioredis';
import pino from 'pino';
import { MainAgentController } from './main-agent/controller';
import { IngestAgent } from './worker-agents/ingest-agent';
import { GeneratorAgent } from './worker-agents/generator-agent';
import { RenderAgent } from './worker-agents/render-agent';
import { PosterAgent } from './worker-agents/poster-agent';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class AgentOrchestrator {
  private controller: MainAgentController;
  private workers: Map<string, any>;

  constructor() {
    this.controller = new MainAgentController(redis, logger);
    this.workers = new Map();
  }

  async start() {
    logger.info('Starting Agent Orchestrator');

    // Start worker agents
    const ingestAgent = new IngestAgent(redis, logger);
    const generatorAgent = new GeneratorAgent(redis, logger);
    const renderAgent = new RenderAgent(redis, logger);
    const posterAgent = new PosterAgent(redis, logger);

    this.workers.set('ingest', ingestAgent);
    this.workers.set('generate', generatorAgent);
    this.workers.set('render', renderAgent);
    this.workers.set('poster', posterAgent);

    // Start controller
    await this.controller.start();

    // Start workers
    ingestAgent.start();
    generatorAgent.start();
    renderAgent.start();
    posterAgent.start();

    logger.info('All agent workers started');
  }

  async stop() {
    logger.info('Stopping Agent Orchestrator');
    for (const [, worker] of this.workers) {
      worker.stop();
    }
    process.exit(0);
  }
}

const orchestrator = new AgentOrchestrator();

process.on('SIGTERM', () => orchestrator.stop());
process.on('SIGINT', () => orchestrator.stop());

orchestrator.start().catch(console.error);
