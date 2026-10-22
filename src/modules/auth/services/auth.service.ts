import { randomUUID } from 'node:crypto';

import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { EmailType, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

import { DatabaseService } from 'src/common/database/services/database.service';
import { EmailQueueService } from 'src/common/email/queues/email.queue.service';
import { type IAuthUser } from 'src/common/request/interfaces/request.interface';

import { AuthCodeService } from './auth.code.service';
import { AuthTokenService } from './auth.token.service';
import { type AuthLoginDto } from '../dtos/auth.login.dto';
import { type AuthResetPasswordDto } from '../dtos/auth.reset-password.dto';
import {
    type AuthResponseDto,
    type AuthSendCodeResponseDto,
} from '../dtos/auth.response.dto';
import { type AuthSendCodeDto } from '../dtos/auth.send-code.dto';
import { type AuthSignupDto } from '../dtos/auth.signup.dto';
import { type AuthTokenDto } from '../dtos/auth.token.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly tokenService: AuthTokenService,
        private readonly codeService: AuthCodeService,
        private readonly emailQueueService: EmailQueueService
    ) {}

    async sendVerificationCode(
        payload: AuthSendCodeDto
    ): Promise<AuthSendCodeResponseDto> {
        const { email } = payload;
        const user = await this.databaseService.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (payload.scene === EmailType.SIGNUP && user) {
            throw new ConflictException('该邮箱已被注册');
        }
        if (payload.scene === EmailType.PASSWORD_RESET && !user) {
            return this.codeService.timings();
        }

        const issued = await this.codeService.issue(payload.scene, email);
        await this.emailQueueService.enqueueVerificationCode({
            email,
            scene: payload.scene,
            code: issued.code,
            userId: user?.id,
        });
        return issued;
    }

    async login({ email, password }: AuthLoginDto): Promise<AuthResponseDto> {
        const user = await this.databaseService.user.findUnique({
            where: { email },
        });
        const matched =
            user !== null && (await argon2.verify(user.passwordHash, password));
        if (!user || !matched) {
            throw new UnauthorizedException('邮箱或密码错误');
        }

        const tokens = await this.tokenService.issueSession({
            userId: user.id,
            role: user.role,
        });
        return { ...tokens, user };
    }

    async signup(data: AuthSignupDto): Promise<AuthResponseDto> {
        const { email } = data;
        const exists = await this.databaseService.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (exists) {
            throw new ConflictException('该邮箱已被注册');
        }

        await this.codeService.verify(EmailType.SIGNUP, email, data.code);

        const hashed = await argon2.hash(data.password);
        const user = await this.databaseService.user.create({
            data: {
                email,
                passwordHash: hashed,
                role: UserRole.MEMBER,
                userName: `user-${randomUUID().slice(0, 8)}`,
            },
        });

        const tokens = await this.tokenService.issueSession({
            userId: user.id,
            role: user.role,
        });
        return { ...tokens, user };
    }

    async resetPassword(payload: AuthResetPasswordDto): Promise<void> {
        const { email } = payload;
        await this.codeService.verify(
            EmailType.PASSWORD_RESET,
            email,
            payload.code
        );

        const user = await this.databaseService.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        const hashed = await argon2.hash(payload.password);
        await this.databaseService.user.update({
            where: { id: user.id },
            data: { passwordHash: hashed },
        });
        await this.tokenService.revokeUserTokens(user.id);
    }

    async refreshTokens(payload: IAuthUser): Promise<AuthTokenDto> {
        return this.tokenService.issueSession(payload);
    }

    async logout(payload: IAuthUser): Promise<void> {
        await this.tokenService.revokeUserTokens(payload.userId);
    }
}
