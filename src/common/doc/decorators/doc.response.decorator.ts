import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { type ZodType, z } from 'zod';

import { type IResponseDocOptions } from '../interfaces/doc.interface';

export function toOpenApiSchema(schema: ZodType): Record<string, unknown> {
    return z.toJSONSchema(schema, {
        target: 'openapi-3.0',
        unrepresentable: 'any',
        override: ctx => {
            if (ctx.zodSchema._zod.def.type === 'date') {
                ctx.jsonSchema.type = 'string';
                ctx.jsonSchema.format = 'date-time';
            }
        },
    });
}

export function buildResponseEnvelopeSchema(
    httpStatus: number,
    message: string,
    dataSchema?: Record<string, unknown>
): Record<string, unknown> {
    const properties: Record<string, unknown> = {
        statusCode: { type: 'number', example: httpStatus },
        message: { type: 'string', example: message },
        timestamp: { type: 'string', example: new Date().toISOString() },
    };

    if (dataSchema) properties.data = dataSchema;

    return {
        type: 'object',
        properties,
        required: dataSchema
            ? ['statusCode', 'message', 'timestamp', 'data']
            : ['statusCode', 'message', 'timestamp'],
    };
}

export function DocResponse(options: IResponseDocOptions): MethodDecorator {
    const { httpStatus, serialization, message } = options;

    const schema = buildResponseEnvelopeSchema(
        httpStatus,
        message,
        serialization ? toOpenApiSchema(serialization) : undefined
    );

    return applyDecorators(
        ApiResponse({
            status: httpStatus,
            description: message,
            schema,
        })
    );
}
