import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
} from '@nestjs/terminus';
import { RedisService } from '@nestjs-redisx/core';

import { DatabaseService } from 'src/common/database/services/database.service';
import { DocEndpoint } from 'src/common/doc/decorators/doc.endpoint.decorator';
import { PublicRoute } from 'src/common/request/decorators/public-route.decorator';

import { HealthResponseSchema } from '../dtos/health.response.dto';

@ApiTags('Health')
@PublicRoute()
@Controller('health')
export class HealthController {
    constructor(
        private readonly healthCheckService: HealthCheckService,
        private readonly databaseService: DatabaseService,
        private readonly redisService: RedisService
    ) {}

    @Get()
    @DocEndpoint({
        summary: '服务健康检查 -「公开」',
        serialization: HealthResponseSchema,
        message: '请求成功',
    })
    @HealthCheck()
    getHealth(): Promise<HealthCheckResult> {
        return this.healthCheckService.check([
            () => this.databaseService.isHealthy(),
            async () => {
                try {
                    const status = await this.redisService.ping();
                    return {
                        redis: { status: status === 'PONG' ? 'up' : 'down' },
                    };
                } catch {
                    return { redis: { status: 'down' } };
                }
            },
        ]);
    }
}
