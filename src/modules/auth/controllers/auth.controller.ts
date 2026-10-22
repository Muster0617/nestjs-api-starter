import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { DocEndpoint } from 'src/common/doc/decorators/doc.endpoint.decorator';
import { AuthUser } from 'src/common/request/decorators/auth-user.decorator';
import { type IAuthUser } from 'src/common/request/interfaces/request.interface';

import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@ApiBearerAuth('accessToken')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @DocEndpoint({
        summary: '退出登录 -「登录用户」',
        message: '退出登录成功',
    })
    logout(@AuthUser() user: IAuthUser): Promise<void> {
        return this.authService.logout(user);
    }
}
