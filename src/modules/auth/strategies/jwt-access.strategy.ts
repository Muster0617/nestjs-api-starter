import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { type Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { type AuthConfig, type IAppConfiguration } from 'src/common/config';
import { type IAuthUser } from 'src/common/request/interfaces/request.interface';

import { AuthTokenService } from '../services/auth.token.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
    Strategy,
    'jwt-access'
) {
    constructor(
        configService: ConfigService<IAppConfiguration, true>,
        private readonly tokenService: AuthTokenService
    ) {
        const secret =
            configService.getOrThrow<AuthConfig>('auth').accessToken.secret;

        if (!secret) {
            throw new Error('环境变量 AUTH_ACCESS_TOKEN_SECRET 未配置');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            passReqToCallback: true,
            secretOrKey: secret,
        });
    }

    validate(
        request: Request,
        payload: Record<string, string | number>
    ): Promise<IAuthUser> {
        const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

        return this.tokenService.resolveSubject(
            'accessToken',
            accessToken,
            payload.jti
        );
    }
}
