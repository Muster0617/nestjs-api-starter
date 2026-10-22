import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
    accessToken: {
        secret: process.env.AUTH_ACCESS_TOKEN_SECRET,
        tokenExp: process.env.AUTH_ACCESS_TOKEN_EXP ?? '15m',
    },
    refreshToken: {
        secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
        tokenExp: process.env.AUTH_REFRESH_TOKEN_EXP ?? '7d',
    },
}));
