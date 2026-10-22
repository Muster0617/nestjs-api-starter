import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const UserResponseSchema = z.object({
    id: z.string().meta({
        description: '用户 ID',
        examples: ['00000000-0000-4000-8000-000000000000'],
    }),
    userName: z.string().meta({
        description: '用户名',
        examples: ['demo-user'],
    }),
    email: z.string().meta({
        description: '用户邮箱',
        examples: ['user@example.com'],
    }),
    avatar: z
        .string()
        .nullable()
        .meta({
            description: '头像地址',
            examples: ['user-avatars/demo.jpg'],
        }),
    role: z.enum(UserRole).meta({
        description: '用户角色',
        examples: [UserRole.MEMBER],
    }),
    createdAt: z.date().meta({
        description: '创建时间',
        examples: ['2024-01-01T00:00:00.000Z'],
    }),
    updatedAt: z.date().meta({
        description: '更新时间',
        examples: ['2024-01-02T00:00:00.000Z'],
    }),
});

export type UserResponseDto = z.infer<typeof UserResponseSchema>;
