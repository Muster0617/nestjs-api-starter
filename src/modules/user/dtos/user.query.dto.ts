import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const UserQuerySchema = z.strictObject({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1)
        .meta({ description: '页码，从 1 开始', examples: [1] }),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10)
        .meta({ description: '每页条目数，上限 100', examples: [10] }),
    keyword: z
        .string()
        .optional()
        .meta({ description: '按邮箱或用户名模糊搜索', examples: ['admin'] }),
    role: z
        .enum(UserRole)
        .optional()
        .meta({ description: '按角色过滤', examples: [UserRole.ADMIN] }),
});

export type UserQueryDto = z.infer<typeof UserQuerySchema>;
