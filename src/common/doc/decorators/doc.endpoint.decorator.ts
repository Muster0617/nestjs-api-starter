import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { ResponseMetadata } from 'src/common/response/decorators/response.decorator';

import { DocGenericResponse } from './doc.generic.decorator';
import { DocPaginatedResponse } from './doc.paginated.decorator';
import { DocResponse } from './doc.response.decorator';
import {
    type IDocBaseOptions,
    type IDocTypedOptions,
    type IResponseDocOptions,
} from '../interfaces/doc.interface';

function resolveDocDecorator(
    options: IResponseDocOptions,
    hasSerialization: boolean,
    paginated: boolean
): MethodDecorator {
    if (paginated && hasSerialization) {
        return DocPaginatedResponse(options);
    }
    if (hasSerialization) {
        return DocResponse(options);
    }

    return DocGenericResponse(options);
}

export function DocEndpoint(options: IDocTypedOptions): MethodDecorator;
export function DocEndpoint(options: IDocBaseOptions): MethodDecorator;
export function DocEndpoint(
    options: IDocBaseOptions & Partial<IDocTypedOptions>
): MethodDecorator {
    const { summary, message, serialization, paginated } = options;
    const httpStatus = options.httpStatus ?? HttpStatus.OK;

    return applyDecorators(
        ResponseMetadata({
            message,
            serialization,
            paginated: Boolean(paginated),
        }),
        ApiOperation({ summary }),
        resolveDocDecorator(
            { httpStatus, message, serialization },
            Boolean(serialization),
            Boolean(paginated)
        )
    );
}
