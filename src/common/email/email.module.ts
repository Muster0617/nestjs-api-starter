import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';

import { EMAIL_QUEUE } from './constants/email.constant';
import { EmailProcessor } from './queues/email.processor';
import { EmailQueueService } from './queues/email.queue.service';
import { EmailHistoryService } from './services/email-history.service';
import { EmailService } from './services/email.service';

@Module({
    imports: [DatabaseModule, BullModule.registerQueue({ name: EMAIL_QUEUE })],
    providers: [
        EmailService,
        EmailHistoryService,
        EmailQueueService,
        EmailProcessor,
    ],
    exports: [EmailQueueService],
})
export class EmailModule {}
