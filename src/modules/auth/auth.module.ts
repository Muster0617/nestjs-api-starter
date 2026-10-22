import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { CacheModule } from 'src/common/cache/cache.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { EmailModule } from 'src/common/email/email.module';

import { AuthController } from './controllers/auth.controller';
import { AuthPublicController } from './controllers/auth.public.controller';
import { AuthCodeService } from './services/auth.code.service';
import { AuthService } from './services/auth.service';
import { AuthTokenService } from './services/auth.token.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({}),
        CacheModule,
        DatabaseModule,
        EmailModule,
    ],
    controllers: [AuthPublicController, AuthController],
    providers: [
        AuthService,
        AuthCodeService,
        AuthTokenService,
        JwtAccessStrategy,
        JwtRefreshStrategy,
    ],
    exports: [AuthTokenService],
})
export class AuthModule {}
