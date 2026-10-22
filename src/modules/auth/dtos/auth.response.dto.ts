import { z } from 'zod';

import { UserResponseSchema } from 'src/modules/user/dtos/user.response.dto';

import { AuthTokenSchema } from './auth.token.dto';

export const AuthResponseSchema = AuthTokenSchema.extend({
    user: UserResponseSchema.meta({ description: '当前登录用户' }),
});

export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;

export const AuthSendCodeResponseSchema = z.object({
    expiresInSeconds: z.number().meta({
        description: '验证码有效期（秒）',
        examples: [600],
    }),
    resendAfterSeconds: z.number().meta({
        description: '距下次可重新获取的冷却秒数',
        examples: [60],
    }),
});

export type AuthSendCodeResponseDto = z.infer<
    typeof AuthSendCodeResponseSchema
>;
