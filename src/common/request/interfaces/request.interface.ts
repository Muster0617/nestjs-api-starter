import { type IncomingMessage } from 'node:http';

import { type ThrottlerStorage } from '@nestjs/throttler';
import { type UserRole } from '@prisma/client';

import { type AUTH_ERROR_MESSAGES } from '../constants/request.constant';

export interface IAuthUser {
    userId: string;
    role: UserRole;
}

export interface IRequest {
    user: IAuthUser;
}

export interface IRateLimitRequest extends IncomingMessage {
    ip?: string;
}

export type ThrottlerStorageRecord = Awaited<
    ReturnType<ThrottlerStorage['increment']>
>;

export type AuthTokenKind = keyof typeof AUTH_ERROR_MESSAGES;
