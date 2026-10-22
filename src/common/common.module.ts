import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BullmqModule } from './bullmq/bullmq.module';
import configs from './config';
import { AppLoggerModule } from './logger/logger.module';
import { RequestModule } from './request/request.module';
import { ResponseModule } from './response/response.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: configs,
            isGlobal: true,
            cache: true,
            expandVariables: true,
        }),
        AppLoggerModule,
        RequestModule,
        ResponseModule,
        BullmqModule,
    ],
})
export class CommonModule {}
