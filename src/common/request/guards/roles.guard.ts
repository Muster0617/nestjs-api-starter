import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type UserRole } from '@prisma/client';

import { ROLES_DECORATOR_KEY } from '../constants/request.constant';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_DECORATOR_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest<{
            user?: { role?: UserRole | UserRole[] };
        }>();

        if (!user?.role) {
            throw new ForbiddenException('用户角色未定义');
        }

        const userRole = user.role;
        const hasRole = requiredRoles.some(role =>
            Array.isArray(userRole)
                ? userRole.includes(role)
                : userRole === role
        );

        if (!hasRole) {
            throw new ForbiddenException('操作权限不足');
        }

        return true;
    }
}
