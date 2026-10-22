import { z } from 'zod';

export const UserUpdateSchema = z.strictObject({
    userName: z
        .string()
        .min(1)
        .optional()
        .meta({
            description: '用户名（全局唯一，重复时返回 409）',
            examples: ['new-user-name'],
        }),
    avatar: z
        .string()
        .optional()
        .meta({
            description: '头像地址',
            examples: ['user-avatars/demo.jpg'],
        }),
});

export type UserUpdateDto = z.infer<typeof UserUpdateSchema>;
