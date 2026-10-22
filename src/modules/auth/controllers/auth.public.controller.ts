import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '@nestjs-redisx/rate-limit';

import { DocEndpoint } from 'src/common/doc/decorators/doc.endpoint.decorator';
import { AuthUser } from 'src/common/request/decorators/auth-user.decorator';
import { PublicRoute } from 'src/common/request/decorators/public-route.decorator';
import { JwtRefreshGuard } from 'src/common/request/guards/jwt-refresh.guard';
import { type IAuthUser } from 'src/common/request/interfaces/request.interface';

import { AuthLoginSchema, type AuthLoginDto } from '../dtos/auth.login.dto';
import {
    AuthResetPasswordSchema,
    type AuthResetPasswordDto,
} from '../dtos/auth.reset-password.dto';
import {
    AuthResponseSchema,
    AuthSendCodeResponseSchema,
    type AuthResponseDto,
    type AuthSendCodeResponseDto,
} from '../dtos/auth.response.dto';
import {
    AuthSendCodeSchema,
    type AuthSendCodeDto,
} from '../dtos/auth.send-code.dto';
import { AuthSignupSchema, type AuthSignupDto } from '../dtos/auth.signup.dto';
import { AuthTokenSchema, type AuthTokenDto } from '../dtos/auth.token.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@PublicRoute()
@Controller('auth')
export class AuthPublicController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @RateLimit({ points: 5, duration: 60 })
    @DocEndpoint({
        summary: '用户登录 -「公开」',
        serialization: AuthResponseSchema,
        message: '登录成功',
    })
    login(
        @Body({ schema: AuthLoginSchema }) payload: AuthLoginDto
    ): Promise<AuthResponseDto> {
        return this.authService.login(payload);
    }

    @Post('send-code')
    @HttpCode(HttpStatus.OK)
    @RateLimit({ points: 1, duration: 60 })
    @DocEndpoint({
        summary: '下发邮箱验证码 -「公开」',
        serialization: AuthSendCodeResponseSchema,
        message: '验证码已发送，请查收邮箱',
    })
    sendCode(
        @Body({ schema: AuthSendCodeSchema }) payload: AuthSendCodeDto
    ): Promise<AuthSendCodeResponseDto> {
        return this.authService.sendVerificationCode(payload);
    }

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    @RateLimit({ points: 5, duration: 60 })
    @DocEndpoint({
        summary: '用户注册 -「公开」',
        serialization: AuthResponseSchema,
        httpStatus: HttpStatus.CREATED,
        message: '账号创建成功',
    })
    signup(
        @Body({ schema: AuthSignupSchema }) payload: AuthSignupDto
    ): Promise<AuthResponseDto> {
        return this.authService.signup(payload);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @RateLimit({ points: 5, duration: 60 })
    @DocEndpoint({
        summary: '凭邮箱验证码重置密码 -「公开」',
        message: '密码重置成功',
    })
    resetPassword(
        @Body({ schema: AuthResetPasswordSchema }) payload: AuthResetPasswordDto
    ): Promise<void> {
        return this.authService.resetPassword(payload);
    }

    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtRefreshGuard)
    @ApiBearerAuth('refreshToken')
    @RateLimit({ points: 5, duration: 60 })
    @DocEndpoint({
        summary: '刷新令牌 -「登录用户」',
        serialization: AuthTokenSchema,
        message: '令牌刷新成功',
    })
    refreshTokens(@AuthUser() user: IAuthUser): Promise<AuthTokenDto> {
        return this.authService.refreshTokens(user);
    }
}
