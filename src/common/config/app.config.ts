import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
    const env = process.env.NODE_ENV ?? 'production';

    return {
        env,

        throttle: {
            ttl: 60000,
            limit: 100,
        },

        http: {
            host: process.env.HTTP_HOST ?? 'localhost',
            port: process.env.HTTP_PORT
                ? Number.parseInt(process.env.HTTP_PORT)
                : 3000,
        },

        cors: {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        },

        log: {
            level: env === 'production' ? 'info' : 'debug',
            dir: 'logs',
            maxFiles: 7,
        },
    };
});
