import { createHash, randomUUID } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';

import { CacheService } from 'src/common/cache/services/cache.service';
import { type AuthConfig, type IAppConfiguration } from 'src/common/config';
import { AUTH_ERROR_MESSAGES } from 'src/common/request/constants/request.constant';
import {
    type AuthTokenKind,
    type IAuthUser,
} from 'src/common/request/interfaces/request.interface';

import {
    AUTH_TOKEN_REVOKE_USER_LUA,
    AUTH_TOKEN_ROTATE_SESSION_LUA,
} from '../constants/auth.constant';
import { type AuthTokenDto } from '../dtos/auth.token.dto';
import { type ITokenRecord } from '../interfaces/auth.interface';

@Injectable()
export class AuthTokenService {
    private readonly authConfig: AuthConfig;
    private readonly accessSecret: string;
    private readonly refreshSecret: string;
    private readonly accessTtlSeconds: number;
    private readonly refreshTtlSeconds: number;

    constructor(
        private readonly cacheService: CacheService,
        private readonly jwtService: JwtService,
        configService: ConfigService<IAppConfiguration, true>
    ) {
        const config = configService.getOrThrow<AuthConfig>('auth');

        this.authConfig = config;
        this.accessSecret = AuthTokenService.requireSecret(
            config.accessToken.secret,
            'AUTH_ACCESS_TOKEN_SECRET'
        );
        this.refreshSecret = AuthTokenService.requireSecret(
            config.refreshToken.secret,
            'AUTH_REFRESH_TOKEN_SECRET'
        );
        this.accessTtlSeconds = AuthTokenService.parseTtl(
            config.accessToken.tokenExp
        );
        this.refreshTtlSeconds = AuthTokenService.parseTtl(
            config.refreshToken.tokenExp
        );
    }

    private static requireSecret(
        secret: string | undefined,
        name: string
    ): string {
        if (!secret) {
            throw new Error(`环境变量 ${name} 未配置`);
        }

        return secret;
    }

    private static hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private static accessKey(hash: string): string {
        return `auth:access:${hash}`;
    }

    private static refreshKey(hash: string): string {
        return `auth:refresh:${hash}`;
    }

    private static userKey(userId: string): string {
        return `auth:user:${userId}`;
    }

    private static sessionKey(userId: string): string {
        return `auth:session:${userId}`;
    }

    async issueSession(payload: IAuthUser): Promise<AuthTokenDto> {
        const jti = randomUUID();
        const tokens = await this.signTokens(payload, jti);
        const accessHash = AuthTokenService.hash(tokens.accessToken);
        const refreshHash = AuthTokenService.hash(tokens.refreshToken);
        const record: ITokenRecord = {
            userId: payload.userId,
            role: payload.role,
        };

        await this.cacheService
            .getClient()
            .eval(
                AUTH_TOKEN_ROTATE_SESSION_LUA,
                2,
                AuthTokenService.userKey(payload.userId),
                AuthTokenService.sessionKey(payload.userId),
                AuthTokenService.accessKey(accessHash),
                JSON.stringify(record),
                this.accessTtlSeconds,
                AuthTokenService.refreshKey(refreshHash),
                this.refreshTtlSeconds,
                accessHash,
                refreshHash,
                jti
            );

        return tokens;
    }

    private async getTokenRecord(
        kind: AuthTokenKind,
        token: string
    ): Promise<ITokenRecord | null> {
        const hash = AuthTokenService.hash(token);
        return this.cacheService.get<ITokenRecord>(
            kind === 'accessToken'
                ? AuthTokenService.accessKey(hash)
                : AuthTokenService.refreshKey(hash)
        );
    }

    async resolveSubject(
        kind: AuthTokenKind,
        token: string | null,
        jti: unknown
    ): Promise<IAuthUser> {
        const record = token ? await this.getTokenRecord(kind, token) : null;

        if (
            !token ||
            !record ||
            typeof jti !== 'string' ||
            !(await this.isSessionActive(record.userId, jti))
        ) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES[kind].invalid);
        }

        return { userId: record.userId, role: record.role };
    }

    async isSessionActive(userId: string, jti: string): Promise<boolean> {
        const current = await this.cacheService.get<string>(
            AuthTokenService.sessionKey(userId)
        );
        return current !== null && current === jti;
    }

    async revokeUserTokens(userId: string): Promise<void> {
        await this.cacheService
            .getClient()
            .eval(
                AUTH_TOKEN_REVOKE_USER_LUA,
                2,
                AuthTokenService.userKey(userId),
                AuthTokenService.sessionKey(userId)
            );
    }

    private async signTokens(
        payload: IAuthUser,
        jti: string
    ): Promise<AuthTokenDto> {
        const claims = { userId: payload.userId, role: payload.role, jti };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(claims, this.signOptions('accessToken')),
            this.jwtService.signAsync(claims, this.signOptions('refreshToken')),
        ]);
        return { accessToken, refreshToken };
    }

    private signOptions(kind: 'accessToken' | 'refreshToken'): JwtSignOptions {
        return {
            secret:
                kind === 'accessToken' ? this.accessSecret : this.refreshSecret,
            expiresIn:
                kind === 'accessToken'
                    ? this.authConfig.accessToken.tokenExp
                    : this.authConfig.refreshToken.tokenExp,
        } as JwtSignOptions;
    }

    private static parseTtl(exp: string): number {
        const match = /^(\d+)([smhdw])$/.exec(exp.trim());
        if (!match) {
            throw new Error(
                `Invalid token expiry format: "${exp}". Expected e.g. "15m", "7d".`
            );
        }
        const value = Number(match[1]);
        const units: Record<string, number> = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
            w: 604800,
        };
        return value * (units[match[2]] ?? 1);
    }
}
