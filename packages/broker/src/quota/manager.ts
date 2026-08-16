import Redis from 'ioredis';
import pino from 'pino';
import { AdapterInterface } from '../types/adapter';

export class QuotaManager {
  private redis: Redis;
  private logger: pino.Logger;
  private readonly DAILY_LIMIT = 100000; // Default daily token limit per brand

  constructor(redis: Redis, logger: pino.Logger) {
    this.redis = redis;
    this.logger = logger.child({ module: 'quota-manager' });
  }

  async checkQuota(brandId: string, provider: string): Promise<boolean> {
    const key = `quota:${brandId}:${provider}:${this.getCurrentDateKey()}`;
    const used = await this.redis.get(key);
    const usage = parseInt(used || '0');
    return usage < this.DAILY_LIMIT;
  }

  async recordUsage(brandId: string, provider: string, tokens: number): Promise<void> {
    const key = `quota:${brandId}:${provider}:${this.getCurrentDateKey()}`;
    await this.redis.incrby(key, tokens);
    await this.redis.expire(key, 86400); // 24 hours
  }

  async getUsage(brandId?: string, provider?: string): Promise<any> {
    const dateKey = this.getCurrentDateKey();
    const results: any[] = [];

    if (brandId && provider) {
      const key = `quota:${brandId}:${provider}:${dateKey}`;
      const used = parseInt(await this.redis.get(key) || '0');
      results.push({ brandId, provider, dateKey, used, limit: this.DAILY_LIMIT, remaining: this.DAILY_LIMIT - used });
    } else if (brandId) {
      for (const prov of ['omniroute', 'gemini', 'nvidia']) {
        const key = `quota:${brandId}:${prov}:${dateKey}`;
        const used = parseInt(await this.redis.get(key) || '0');
        results.push({ brandId, provider: prov, dateKey, used, limit: this.DAILY_LIMIT, remaining: this.DAILY_LIMIT - used });
      }
    }

    return results;
  }

  selectBestProvider(brandId: string, adapters: Map<string, AdapterInterface>): AdapterInterface | null {
    // Simple priority-based selection (can be enhanced with fill-first, weighted, etc.)
    const priority = ['omniroute', 'gemini', 'nvidia'];

    for (const name of priority) {
      const adapter = adapters.get(name);
      if (adapter) {
        // Check quota for this provider
        this.checkQuota(brandId, name).then(available => {
          if (available) this.logger.info({ brandId, provider: name }, 'Selected provider');
        });
        return adapter;
      }
    }

    return null;
  }

  private getCurrentDateKey(): string {
    return new Date().toISOString().split('T')[0];
  }
}
