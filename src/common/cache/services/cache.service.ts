import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '../constants/cache.constant';

@Injectable()
export class CacheService implements OnModuleDestroy {
    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

    async onModuleDestroy(): Promise<void> {
        await this.redis.quit();
    }

    async get<T = string>(key: string): Promise<T | null> {
        return CacheService.parse<T>(await this.redis.get(key));
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const serialised = JSON.stringify(value);

        if (serialised === undefined) {
            throw new Error(`缓存值无法序列化为 JSON: ${key}`);
        }

        if (ttlSeconds !== undefined && ttlSeconds > 0) {
            await this.redis.set(key, serialised, 'EX', ttlSeconds);
            return;
        }

        await this.redis.set(key, serialised);
    }

    private static parse<T>(value: string | null): T | null {
        if (value === null) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return value as unknown as T;
        }
    }

    isHealthy(): boolean {
        return this.redis.status === 'ready';
    }

    getClient(): Redis {
        return this.redis;
    }
}
