import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { AuthModule } from 'src/modules/auth/auth.module';

import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
