import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { type DatabaseConfig, type IAppConfiguration } from 'src/common/config';

@Injectable()
export class DatabaseService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    private readonly pool: Pool;

    constructor(configService: ConfigService<IAppConfiguration, true>) {
        const config = configService.getOrThrow<DatabaseConfig>('database');
        const pool = new Pool({
            connectionString: config.url,
            max: Math.max(1, Number(process.env.DATABASE_POOL_MAX) || 10),
            connectionTimeoutMillis: 5000,
        });

        super({ adapter: new PrismaPg(pool, { schema: config.schema }) });
        this.pool = pool;
    }

    async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
        await this.pool.end();
    }

    async isHealthy(): Promise<HealthIndicatorResult> {
        try {
            await this.$queryRaw`SELECT 1`;
            return { prisma: { status: 'up' } };
        } catch {
            return { prisma: { status: 'down' } };
        }
    }
}
