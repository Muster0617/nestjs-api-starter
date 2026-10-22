import { join } from 'node:path';

import { registerAs } from '@nestjs/config';

const DEFAULT_TEMPLATE_DIR = join(__dirname, '../email/templates');

export default registerAs('email', () => ({
    host: process.env.EMAIL_HOST ?? '',
    port: Number(process.env.EMAIL_PORT ?? 587),
    user: process.env.EMAIL_USER ?? '',
    password: process.env.EMAIL_PASS ?? '',
    from: process.env.EMAIL_FROM?.trim()
        ? process.env.EMAIL_FROM
        : (process.env.EMAIL_USER ?? ''),

    templateDir: process.env.EMAIL_TEMPLATE_DIR ?? DEFAULT_TEMPLATE_DIR,

    code: {
        ttlSeconds: 600,
        resendCooldownSeconds: 60,
        maxAttempts: 5,
        dailyQuota: 10,
    },

    queue: {
        attempts: 3,
        backoffDelayMs: 2000,
    },
}));
