import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
    const url = process.env.REDIS_URL?.trim();

    if (!url) {
        throw new Error(
            '缺少环境变量 REDIS_URL：请配置形如 redis://:password@host:6379/0 的连接串（TLS 用 rediss://，末段数字为 db 序号）'
        );
    }

    return { url };
});
