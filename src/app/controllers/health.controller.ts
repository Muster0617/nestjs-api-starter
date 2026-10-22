import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
} from '@nestjs/terminus';

import { CacheService } from 'src/common/cache/services/cache.service';
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
        private readonly cacheService: CacheService
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
            () => ({
                redis: {
                    status: this.cacheService.isHealthy() ? 'up' : 'down',
                },
            }),
        ]);
    }
}
