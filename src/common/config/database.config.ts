import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
    const url = process.env.DATABASE_URL?.trim();

    if (!url) {
        throw new Error(
            '缺少环境变量 DATABASE_URL：请配置形如 postgresql://user:password@host:5432/dbname?schema=public 的连接串'
        );
    }

    let schema: string | null;

    try {
        schema = new URL(url).searchParams.get('schema');
    } catch {
        throw new Error(
            `环境变量 DATABASE_URL 不是合法的连接串，当前值: "${url}"`
        );
    }

    return {
        url,
        schema:
            schema === null || schema.trim() === '' ? 'public' : schema.trim(),
    };
});
