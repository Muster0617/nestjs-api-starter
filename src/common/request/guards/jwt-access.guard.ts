import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import {
    AUTH_ERROR_MESSAGES,
    PUBLIC_ROUTE_KEY,
} from '../constants/request.constant';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            PUBLIC_ROUTE_KEY,
            [context.getHandler(), context.getClass()]
        );
        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest<TUser = unknown>(
        err: unknown,
        user: TUser | false,
        _info: unknown,
        _context: ExecutionContext,
        _status?: unknown
    ): TUser {
        if (err) {
            throw err instanceof Error
                ? err
                : new UnauthorizedException(
                      AUTH_ERROR_MESSAGES.accessToken.missing
                  );
        }
        if (!user) {
            throw new UnauthorizedException(
                AUTH_ERROR_MESSAGES.accessToken.missing
            );
        }

        return user;
    }
}
