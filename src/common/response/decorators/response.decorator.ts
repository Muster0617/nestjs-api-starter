import { applyDecorators, SetMetadata } from '@nestjs/common';

import {
    RESPONSE_MESSAGE_META_KEY,
    RESPONSE_PAGINATED_META_KEY,
    RESPONSE_SERIALIZATION_META_KEY,
} from '../constants/response.constant';
import { type IResponseMetadataOptions } from '../interfaces/response.interface';

export function ResponseMetadata(
    options: IResponseMetadataOptions
): MethodDecorator {
    return applyDecorators(
        SetMetadata(RESPONSE_MESSAGE_META_KEY, options.message),
        SetMetadata(RESPONSE_SERIALIZATION_META_KEY, options.serialization),
        SetMetadata(RESPONSE_PAGINATED_META_KEY, options.paginated ?? false)
    );
}
