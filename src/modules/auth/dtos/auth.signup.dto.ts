import { type z } from 'zod';

import { verificationCodeSchema } from 'src/common/email/dtos/verification-code.dto';

import { AuthLoginSchema } from './auth.login.dto';
import { AuthPasswordSchema } from './auth.password.dto';

export const AuthSignupSchema = AuthLoginSchema.extend({
    password: AuthPasswordSchema,
    code: verificationCodeSchema.meta({
        description: '注册邮箱收到的验证码',
        examples: ['123456'],
    }),
});

export type AuthSignupDto = z.infer<typeof AuthSignupSchema>;
