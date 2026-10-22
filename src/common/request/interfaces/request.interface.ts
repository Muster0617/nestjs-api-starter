import { type UserRole } from '@prisma/client';

import { type AUTH_ERROR_MESSAGES } from '../constants/request.constant';

export interface IAuthUser {
    userId: string;
    role: UserRole;
}

export interface IRequest {
    user: IAuthUser;
}

export type AuthTokenKind = keyof typeof AUTH_ERROR_MESSAGES;
