import { type UserRole } from '@prisma/client';

import { type AuthSendCodeResponseDto } from '../dtos/auth.response.dto';

export interface ICodeRecord {
    hash: string;
    attempts: number;
    sentAt: number;
}

export interface IIssuedCode extends AuthSendCodeResponseDto {
    code: string;
}

export interface ITokenRecord {
    userId: string;
    role: UserRole;
}
