import { EmailType } from '@prisma/client';
import { z } from 'zod';

import { AuthLoginSchema } from './auth.login.dto';

export const AuthSendCodeSchema = z.strictObject({
    email: AuthLoginSchema.shape.email,
    scene: z.enum(EmailType, { error: '验证码用途不合法' }).meta({
        description: '验证码用途，注册与重置密码互不通用',
        examples: [EmailType.SIGNUP],
    }),
});

export type AuthSendCodeDto = z.infer<typeof AuthSendCodeSchema>;
