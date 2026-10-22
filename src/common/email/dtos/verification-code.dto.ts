import { z } from 'zod';

import { VERIFICATION_CODE_LENGTH } from '../constants/email.constant';

export const verificationCodeSchema = z
    .string()
    .regex(/^\d+$/, '验证码必须是数字')
    .length(
        VERIFICATION_CODE_LENGTH,
        `验证码为 ${VERIFICATION_CODE_LENGTH} 位数字`
    );
