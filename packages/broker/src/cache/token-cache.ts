import Redis from 'ioredis';
import { GenerateResult } from '../types/adapter';

export class TokenCache {
  private redis: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get(key: string): Promise<GenerateResult | null> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async set(key: string, result: GenerateResult, ttl?: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(result), 'EX', ttl || this.DEFAULT_TTL);
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
