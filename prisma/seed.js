const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, UserRole } = require('@prisma/client');
const argon2 = require('argon2');

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            '缺少环境变量 DATABASE_URL：请配置形如 postgresql://user:password@host:5432/dbname 的连接串'
        );
    }

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const userName = process.env.SEED_ADMIN_USERNAME;
    if (!email || !password || !userName) {
        throw new Error(
            '缺少 seed 配置：请设置 SEED_ADMIN_EMAIL、SEED_ADMIN_PASSWORD、SEED_ADMIN_USERNAME'
        );
    }

    const prisma = new PrismaClient({ adapter: new PrismaPg(url) });

    try {
        const exists = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (exists) {
            console.log(`管理员已存在: ${email}，跳过`);
            return;
        }

        const passwordHash = await argon2.hash(password);
        await prisma.user.create({
            data: { email, userName, passwordHash, role: UserRole.ADMIN },
        });
        console.log(`已创建管理员: ${email}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error('seed 失败:', error);
    process.exitCode = 1;
});
