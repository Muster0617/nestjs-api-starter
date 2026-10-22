import { z } from 'zod';

export const AuthLoginSchema = z.strictObject({
    email: z.email('邮箱格式不正确').meta({
        description: '用户邮箱',
        examples: ['admin@example.com'],
    }),
    password: z
        .string()
        .min(1)
        .meta({ description: '密码', examples: ['Admin@1234'] }),
});

export type AuthLoginDto = z.infer<typeof AuthLoginSchema>;
