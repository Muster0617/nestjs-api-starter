import {
    type ExecutionContext,
    HttpException,
    HttpStatus,
    Module,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CachePlugin } from '@nestjs-redisx/cache';
import { RedisModule } from '@nestjs-redisx/core';
import { LocksPlugin } from '@nestjs-redisx/locks';
import { RateLimitPlugin } from '@nestjs-redisx/rate-limit';

import {
    type AppConfig,
    type IAppConfiguration,
    type LockConfig,
    type RedisConfig,
} from 'src/common/config';
import { RATE_LIMIT_ERROR_MESSAGE } from 'src/common/request/constants/request.constant';

@Module({
    imports: [
        RedisModule.forRootAsync({
            plugins: [
                RateLimitPlugin.registerAsync({
                    inject: [ConfigService],
                    useFactory: (
                        configService: ConfigService<IAppConfiguration, true>
                    ) => {
                        const config =
                            configService.getOrThrow<AppConfig>('app');

                        return {
                            store: 'redis',
                            client: 'cache',
                            defaultPoints: config.throttle.limit,
                            defaultDuration: config.throttle.ttl / 1000,
                            errorPolicy: 'fail-closed',
                            includeHeaders: true,
                            defaultKeyExtractor: (
                                context: ExecutionContext
                            ): string => {
                                const request = context
                                    .switchToHttp()
                                    .getRequest<{
                                        ip?: string;
                                        socket?: { remoteAddress?: string };
                                    }>();
                                const address =
                                    request.ip ??
                                    request.socket?.remoteAddress ??
                                    'unknown';

                                return `${context.getClass().name}:${
                                    context.getHandler().name
                                }:${address
                                    .replace(/^::ffff:/, '')
                                    .replace(/%\w+$/, '')}`;
                            },
                            errorFactory: () =>
                                new HttpException(
                                    RATE_LIMIT_ERROR_MESSAGE,
                                    HttpStatus.TOO_MANY_REQUESTS
                                ),
                        };
                    },
                }),
                new CachePlugin({
                    client: 'cache',
                    l1: { enabled: false },
                    l2: { enabled: true, defaultTtl: 300, keyPrefix: 'cache:' },
                    stampede: { enabled: true, fallback: 'load' },
                    tags: { enabled: true },
                }),
                LocksPlugin.registerAsync({
                    inject: [ConfigService],
                    useFactory: (
                        configService: ConfigService<IAppConfiguration, true>
                    ) => {
                        const config =
                            configService.getOrThrow<LockConfig>('lock');

                        return {
                            client: 'cache',
                            defaultTtl: config.defaultTtl,
                            maxTtl: config.maxTtl,
                            keyPrefix: config.keyPrefix,
                            retry: config.retry,
                            autoRenew: config.autoRenew,
                        };
                    },
                }),
            ],
            useFactory: (
                configService: ConfigService<IAppConfiguration, true>
            ) => {
                const config = configService.getOrThrow<RedisConfig>('redis');

                return {
                    clients: {
                        default: {
                            type: 'single',
                            url: config.url,
                            db: config.db.business,
                        },
                        cache: {
                            type: 'single',
                            url: config.url,
                            db: config.db.cache,
                        },
                        queue: {
                            type: 'single',
                            url: config.url,
                            db: config.db.queue,
                        },
                    },
                    global: { driver: 'ioredis' },
                };
            },
            inject: [ConfigService],
        }),
    ],
})
export class CacheModule {}
