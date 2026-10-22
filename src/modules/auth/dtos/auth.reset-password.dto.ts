import { z } from 'zod';

import { verificationCodeSchema } from 'src/common/email/dtos/verification-code.dto';

import { AuthLoginSchema } from './auth.login.dto';
import { AuthPasswordSchema } from './auth.password.dto';

export const AuthResetPasswordSchema = z.strictObject({
    email: AuthLoginSchema.shape.email,
    code: verificationCodeSchema.meta({
        description: '重置密码邮箱收到的验证码',
        examples: ['123456'],
    }),
    password: AuthPasswordSchema,
});

export type AuthResetPasswordDto = z.infer<typeof AuthResetPasswordSchema>;
