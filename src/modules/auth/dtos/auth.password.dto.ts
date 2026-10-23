import { z } from 'zod';

export const AuthPasswordSchema = z
    .string()
    .min(1)
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        '密码至少 8 位，且需包含大小写字母、数字和特殊字符'
    )
    .meta({
        description: '密码（至少 8 位，须包含大小写字母、数字及特殊字符）',
        examples: ['Password@123'],
    });
