import { type ThrottlerStorage } from '@nestjs/throttler';
import type Redis from 'ioredis';

import {
    THROTTLER_INCREMENT_LUA,
    THROTTLER_KEY_PREFIX,
} from '../constants/request.constant';
import { type ThrottlerStorageRecord } from '../interfaces/request.interface';

export class ThrottlerRedisStorage implements ThrottlerStorage {
    constructor(private readonly client: Redis) {}

    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string
    ): Promise<ThrottlerStorageRecord> {
        const prefix = `${THROTTLER_KEY_PREFIX}${throttlerName}:`;
        const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] =
            (await this.client.eval(
                THROTTLER_INCREMENT_LUA,
                2,
                `${prefix}${key}`,
                `${prefix}${key}:block`,
                ttl,
                limit,
                blockDuration,
                Date.now()
            )) as [number, number, number, number];

        return {
            totalHits,
            timeToExpire,
            isBlocked: isBlocked === 1,
            timeToBlockExpire,
        };
    }
}
