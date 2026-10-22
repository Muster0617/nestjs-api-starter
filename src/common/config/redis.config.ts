import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
    url: process.env.REDIS_URL?.trim(),
    db: {
        business: 0,
        cache: 1,
        queue: 2,
    },
}));
