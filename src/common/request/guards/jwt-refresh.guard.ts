import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AUTH_ERROR_MESSAGES } from '../constants/request.constant';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
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
                      AUTH_ERROR_MESSAGES.refreshToken.missing
                  );
        }
        if (!user) {
            throw new UnauthorizedException(
                AUTH_ERROR_MESSAGES.refreshToken.missing
            );
        }

        return user;
    }
}
