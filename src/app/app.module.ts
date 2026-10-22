import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CacheModule } from 'src/common/cache/cache.module';
import { CommonModule } from 'src/common/common.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserModule } from 'src/modules/user/user.module';

import { HealthController } from './controllers/health.controller';

@Module({
    imports: [
        CommonModule,
        DatabaseModule,
        CacheModule,
        TerminusModule,
        AuthModule,
        UserModule,
    ],
    controllers: [HealthController],
})
export class AppModule {}
