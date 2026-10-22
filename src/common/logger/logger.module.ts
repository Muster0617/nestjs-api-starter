import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { createLoggerConfig } from './logger.config';

@Module({
    imports: [
        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: createLoggerConfig,
        }),
    ],
    exports: [LoggerModule],
})
export class AppLoggerModule {}
