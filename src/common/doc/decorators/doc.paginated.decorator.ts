import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { ApiPaginationMetadataSchema } from 'src/common/response/dtos/response.paginated.dto';

import {
    buildResponseEnvelopeSchema,
    toOpenApiSchema,
} from './doc.response.decorator';
import { type IResponseDocOptions } from '../interfaces/doc.interface';

export function DocPaginatedResponse(
    options: IResponseDocOptions
): MethodDecorator {
    const { serialization, message, httpStatus } = options;

    const schema = buildResponseEnvelopeSchema(httpStatus, message, {
        type: 'object',
        properties: {
            items: {
                type: 'array',
                items: serialization ? toOpenApiSchema(serialization) : {},
            },
            metadata: toOpenApiSchema(ApiPaginationMetadataSchema),
        },
        required: ['items', 'metadata'],
    });

    return applyDecorators(
        ApiResponse({
            status: httpStatus,
            description: message,
            schema,
        })
    );
}
