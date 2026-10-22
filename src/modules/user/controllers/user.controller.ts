import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Put,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { DocEndpoint } from 'src/common/doc/decorators/doc.endpoint.decorator';
import { AllowRoles } from 'src/common/request/decorators/allow-roles.decorator';
import { AuthUser } from 'src/common/request/decorators/auth-user.decorator';
import { type IAuthUser } from 'src/common/request/interfaces/request.interface';
import { type IApiPaginatedData } from 'src/common/response/interfaces/response.interface';

import { UserQuerySchema, type UserQueryDto } from '../dtos/user.query.dto';
import {
    UserResponseSchema,
    type UserResponseDto,
} from '../dtos/user.response.dto';
import { UserUpdateSchema, type UserUpdateDto } from '../dtos/user.update.dto';
import { UserService } from '../services/user.service';

@ApiTags('User')
@ApiBearerAuth('accessToken')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('list')
    @AllowRoles([UserRole.ADMIN])
    @DocEndpoint({
        summary: '分页搜索用户 -「管理员」',
        serialization: UserResponseSchema,
        paginated: true,
        message: '用户列表获取成功',
    })
    listUsers(
        @Query({ schema: UserQuerySchema }) query: UserQueryDto
    ): Promise<IApiPaginatedData<UserResponseDto>> {
        return this.userService.listUsers(query);
    }

    @Get('profile')
    @DocEndpoint({
        summary: '获取用户资料 -「登录用户」',
        serialization: UserResponseSchema,
        message: '获取用户资料成功',
    })
    getProfile(@AuthUser() user: IAuthUser): Promise<UserResponseDto> {
        return this.userService.getProfile(user.userId);
    }

    @Put(':id')
    @AllowRoles([UserRole.ADMIN])
    @DocEndpoint({
        summary: '更新用户资料 -「管理员」',
        serialization: UserResponseSchema,
        message: '用户更新成功',
    })
    updateUser(
        @Param('id', new ParseUUIDPipe({ version: '4' })) userId: string,
        @Body({ schema: UserUpdateSchema }) payload: UserUpdateDto
    ): Promise<UserResponseDto> {
        return this.userService.updateUser(userId, payload);
    }

    @Delete(':id')
    @AllowRoles([UserRole.ADMIN])
    @DocEndpoint({
        summary: '删除用户 -「管理员」',
        message: '用户删除成功',
    })
    deleteUser(
        @Param('id', new ParseUUIDPipe({ version: '4' })) userId: string
    ): Promise<void> {
        return this.userService.deleteUser(userId);
    }
}
