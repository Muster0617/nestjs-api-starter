import { type HttpStatus } from '@nestjs/common';
import { type ZodType } from 'zod';

export interface IDocBaseOptions {
    summary: string;
    message: string;
    httpStatus?: HttpStatus;
}

export interface IDocTypedOptions extends IDocBaseOptions {
    serialization: ZodType;
    paginated?: boolean;
}

export interface IResponseDocOptions {
    httpStatus: number;
    message: string;
    serialization?: ZodType;
}
