import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type StandardSchemaV1 } from '@standard-schema/spec';
import { concatMap, Observable } from 'rxjs';

import {
    HTTP_SUCCESS_MESSAGES,
    RESPONSE_MESSAGE_META_KEY,
    RESPONSE_PAGINATED_META_KEY,
    RESPONSE_SERIALIZATION_META_KEY,
} from '../constants/response.constant';
import { ResponseSerializerService } from '../services/response.serializer.service';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly serializerService: ResponseSerializerService
    ) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<unknown> {
        return next.handle().pipe(
            concatMap(async responseBody => {
                const ctx = context.switchToHttp();
                const response = ctx.getResponse<{
                    statusCode: number;
                    locals?: Record<string, unknown>;
                }>();
                const statusCode = response.statusCode;

                const schema: StandardSchemaV1 | undefined = this.reflector.get(
                    RESPONSE_SERIALIZATION_META_KEY,
                    context.getHandler()
                );
                const message: string | undefined = this.reflector.get(
                    RESPONSE_MESSAGE_META_KEY,
                    context.getHandler()
                );
                const paginated: boolean =
                    this.reflector.get(
                        RESPONSE_PAGINATED_META_KEY,
                        context.getHandler()
                    ) ?? false;

                const data = await this.serializerService.serialize(
                    responseBody,
                    schema,
                    paginated,
                    `${context.getClass().name}.${context.getHandler().name}`
                );
                const body = {
                    statusCode,
                    message: message ?? HTTP_SUCCESS_MESSAGES[statusCode],
                    timestamp: new Date().toISOString(),
                    ...(data === undefined ? {} : { data }),
                };

                if (response.locals) {
                    response.locals.responseBody = body;
                }

                return body;
            })
        );
    }
}
