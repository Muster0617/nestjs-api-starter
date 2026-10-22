import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
    type ThrottlerGetTrackerFunction,
    ThrottlerGuard,
    ThrottlerModule,
} from '@nestjs/throttler';
import type Redis from 'ioredis';

import { CacheModule } from 'src/common/cache/cache.module';
import { REDIS_CLIENT } from 'src/common/cache/constants/cache.constant';
import { type AppConfig, type IAppConfiguration } from 'src/common/config';

import { THROTTLER_ERROR_MESSAGE } from './constants/request.constant';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { RolesGuard } from './guards/roles.guard';
import { type IRateLimitRequest } from './interfaces/request.interface';
import { ThrottlerRedisStorage } from './services/throttler-redis.storage';

@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            imports: [CacheModule],
            useFactory: (
                configService: ConfigService<IAppConfiguration, true>,
                redis: Redis
            ) => {
                const config = configService.getOrThrow<AppConfig>('app');

                return {
                    errorMessage: THROTTLER_ERROR_MESSAGE,
                    throttlers: [
                        {
                            name: 'default',
                            ttl: config.throttle.ttl,
                            limit: config.throttle.limit,
                        },
                    ],
                    getTracker: ((req: IRateLimitRequest): string =>
                        (req.ip ?? req.socket?.remoteAddress ?? 'unknown')
                            .replace(/^::ffff:/, '')
                            .replace(
                                /%\w+$/,
                                ''
                            )) as unknown as ThrottlerGetTrackerFunction,
                    storage: new ThrottlerRedisStorage(redis),
                };
            },
            inject: [ConfigService, REDIS_CLIENT],
        }),
    ],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: JwtAccessGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class RequestModule {}
