import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { buildResponseEnvelopeSchema } from './doc.response.decorator';
import { type IResponseDocOptions } from '../interfaces/doc.interface';

export function DocGenericResponse(
    options: Omit<IResponseDocOptions, 'serialization'>
): MethodDecorator {
    const { message, httpStatus } = options;

    return applyDecorators(
        ApiResponse({
            status: httpStatus,
            description: message,
            schema: buildResponseEnvelopeSchema(httpStatus, message),
        })
    );
}
