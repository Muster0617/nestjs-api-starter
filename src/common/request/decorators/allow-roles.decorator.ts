import { type CustomDecorator, SetMetadata } from '@nestjs/common';
import { type UserRole } from '@prisma/client';

import { ROLES_DECORATOR_KEY } from '../constants/request.constant';

export const AllowRoles = (roles: UserRole[]): CustomDecorator<string> =>
    SetMetadata(ROLES_DECORATOR_KEY, roles);
