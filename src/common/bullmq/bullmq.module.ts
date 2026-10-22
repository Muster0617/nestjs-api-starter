import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type IAppConfiguration, type RedisConfig } from 'src/common/config';

@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: (
                configService: ConfigService<IAppConfiguration, true>
            ) => {
                const config = configService.getOrThrow<RedisConfig>('redis');

                return {
                    connection: { url: config.url, db: config.db.queue },
                };
            },
            inject: [ConfigService],
        }),
    ],
})
export class BullmqModule {}
