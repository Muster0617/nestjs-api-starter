import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { ResponseExceptionFilter } from './filters/response.exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { ResponseSerializerService } from './services/response.serializer.service';

@Module({
    providers: [
        ResponseSerializerService,
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: ResponseExceptionFilter,
        },
    ],
})
export class ResponseModule {}
