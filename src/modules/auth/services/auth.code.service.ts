import { createHash, randomInt } from 'node:crypto';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerException } from '@nestjs/throttler';
import { type EmailType } from '@prisma/client';

import { CacheService } from 'src/common/cache/services/cache.service';
import { type EmailConfig, type IAppConfiguration } from 'src/common/config';
import {
    VERIFICATION_CODE_LENGTH,
    VERIFICATION_KEY_PREFIX,
} from 'src/common/email/constants/email.constant';

import {
    AUTH_CODE_CONSUME_LUA,
    AUTH_CODE_QUOTA_INCR_LUA,
} from '../constants/auth.constant';
import { type AuthSendCodeResponseDto } from '../dtos/auth.response.dto';
import {
    type ICodeRecord,
    type IIssuedCode,
} from '../interfaces/auth.interface';

@Injectable()
export class AuthCodeService {
    private readonly logger = new Logger(AuthCodeService.name);
    private readonly ttlSeconds: number;
    private readonly cooldownSeconds: number;
    private readonly maxAttempts: number;
    private readonly dailyQuota: number;

    constructor(
        private readonly cacheService: CacheService,
        configService: ConfigService<IAppConfiguration, true>
    ) {
        const config = configService.getOrThrow<EmailConfig>('email');

        this.ttlSeconds = config.code.ttlSeconds;
        this.cooldownSeconds = config.code.resendCooldownSeconds;
        this.maxAttempts = config.code.maxAttempts;
        this.dailyQuota = config.code.dailyQuota;
    }

    async issue(scene: EmailType, email: string): Promise<IIssuedCode> {
        const existing = await this.cacheService.get<ICodeRecord>(
            this.codeKey(scene, email)
        );
        if (existing) {
            const waited = Math.floor((Date.now() - existing.sentAt) / 1000);
            const remaining = this.cooldownSeconds - waited;
            if (remaining > 0) {
                throw new ThrottlerException(
                    `获取验证码过于频繁，请 ${remaining} 秒后重试`
                );
            }
        }

        await this.assertDailyQuota(email);

        const code = this.generateCode();
        const record: ICodeRecord = {
            hash: AuthCodeService.hash(code),
            attempts: 0,
            sentAt: Date.now(),
        };
        await this.cacheService.set(
            this.codeKey(scene, email),
            record,
            this.ttlSeconds
        );

        return { code, ...this.timings() };
    }

    timings(): AuthSendCodeResponseDto {
        return {
            expiresInSeconds: this.ttlSeconds,
            resendAfterSeconds: this.cooldownSeconds,
        };
    }

    async verify(scene: EmailType, email: string, code: string): Promise<void> {
        const result = Number(
            await this.cacheService
                .getClient()
                .eval(
                    AUTH_CODE_CONSUME_LUA,
                    1,
                    this.codeKey(scene, email),
                    AuthCodeService.hash(code),
                    this.maxAttempts
                )
        );

        if (result === 1) return;

        const message =
            result === 2
                ? '验证码错误'
                : result === 3
                  ? '验证码错误次数过多，请重新获取'
                  : '验证码已过期或无效，请重新获取';
        throw new BadRequestException(message);
    }

    private generateCode(): string {
        const max = 10 ** VERIFICATION_CODE_LENGTH;
        return `${randomInt(max)}`.padStart(VERIFICATION_CODE_LENGTH, '0');
    }

    private async assertDailyQuota(email: string): Promise<void> {
        const key = `${VERIFICATION_KEY_PREFIX}:quota:${email}:${AuthCodeService.dateKey()}`;
        const used = Number(
            await this.cacheService
                .getClient()
                .eval(
                    AUTH_CODE_QUOTA_INCR_LUA,
                    1,
                    key,
                    AuthCodeService.secondsUntilMidnight(),
                    this.dailyQuota
                )
        );
        if (used < 0) {
            this.logger.warn(`邮箱今日验证码获取次数已达上限: ${email}`);
            throw new ThrottlerException(
                '今日获取验证码次数已达上限，请明天再试'
            );
        }
    }

    private codeKey(scene: EmailType, email: string): string {
        return `${VERIFICATION_KEY_PREFIX}:${scene}:${email}`;
    }

    private static hash(code: string): string {
        return createHash('sha256').update(code).digest('hex');
    }

    private static dateKey(): string {
        return new Date().toISOString().slice(0, 10);
    }

    private static secondsUntilMidnight(): number {
        const now = Date.now();
        const nextMidnight = Math.ceil(now / 86_400_000) * 86_400_000;
        return Math.max(1, Math.floor((nextMidnight - now) / 1000));
    }
}
