import { Injectable, NotFoundException } from '@nestjs/common';
import { Cached, InvalidateTags } from '@nestjs-redisx/cache';
import { type Prisma } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { type IApiPaginatedData } from 'src/common/response/interfaces/response.interface';
import { AuthTokenService } from 'src/modules/auth/services/auth.token.service';

import { type UserQueryDto } from '../dtos/user.query.dto';
import { type UserResponseDto } from '../dtos/user.response.dto';
import { type UserUpdateDto } from '../dtos/user.update.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly tokenService: AuthTokenService
    ) {}

    @Cached({
        key: 'user:profile:{0}',
        tags: ['user:profile:{0}'],
    })
    async getProfile(userId: string): Promise<UserResponseDto> {
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
            omit: { passwordHash: true },
        });
        if (!user) {
            throw new NotFoundException('用户不存在');
        }
        return user;
    }

    async listUsers(
        query: UserQueryDto
    ): Promise<IApiPaginatedData<UserResponseDto>> {
        const { page, limit, keyword, role } = query;

        const where: Prisma.UserWhereInput = {
            ...(role ? { role } : {}),
            ...(keyword
                ? {
                      OR: [
                          {
                              email: {
                                  contains: keyword,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              userName: {
                                  contains: keyword,
                                  mode: 'insensitive',
                              },
                          },
                      ],
                  }
                : {}),
        };

        const [totalItems, users] = await Promise.all([
            this.databaseService.user.count({ where }),
            this.databaseService.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                omit: { passwordHash: true },
            }),
        ]);

        return {
            items: users,
            metadata: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            },
        };
    }

    @InvalidateTags({
        tags: ['user:profile:{0}'],
    })
    async updateUser(
        userId: string,
        data: UserUpdateDto
    ): Promise<UserResponseDto> {
        return this.databaseService.user.update({
            where: { id: userId },
            data,
        });
    }

    @InvalidateTags({
        tags: ['user:profile:{0}'],
    })
    async deleteUser(userId: string): Promise<void> {
        await this.databaseService.user.delete({
            where: { id: userId },
        });
        await this.tokenService.revokeUserTokens(userId);
    }
}
