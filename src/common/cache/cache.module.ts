import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { type IAppConfiguration, type RedisConfig } from 'src/common/config';

import { REDIS_CLIENT } from './constants/cache.constant';
import { CacheService } from './services/cache.service';

@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (
                configService: ConfigService<IAppConfiguration, true>
            ): Redis => {
                const config = configService.getOrThrow<RedisConfig>('redis');
                const client = new Redis(config.url);

                client.on('error', error => {
                    console.error('Redis 客户端异常:', error);
                });

                return client;
            },
        },
        CacheService,
    ],
    exports: [CacheService, REDIS_CLIENT],
})
export class CacheModule {}
