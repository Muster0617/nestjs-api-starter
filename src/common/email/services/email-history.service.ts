import { Injectable } from '@nestjs/common';
import { EmailStatus, type EmailHistory } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';

import { EMAIL_SCENE_COPY } from '../constants/email.constant';
import { type ICreatePendingEmail } from '../interfaces/email.interface';

@Injectable()
export class EmailHistoryService {
    constructor(private readonly databaseService: DatabaseService) {}

    createPending(input: ICreatePendingEmail): Promise<EmailHistory> {
        return this.databaseService.emailHistory.create({
            data: {
                userId: input.userId,
                emailTo: input.email,
                type: input.scene,
                subject: EMAIL_SCENE_COPY[input.scene].subject,
                status: EmailStatus.PENDING,
            },
        });
    }

    async markSent(
        id: string,
        messageId: string,
        attempts: number
    ): Promise<void> {
        await this.databaseService.emailHistory.update({
            where: { id },
            data: {
                status: EmailStatus.SENT,
                messageId,
                retryCount: attempts,
                errorMessage: null,
                sentAt: new Date(),
            },
        });
    }

    async markRetrying(
        id: string,
        attempts: number,
        errorMessage: string
    ): Promise<void> {
        await this.databaseService.emailHistory.update({
            where: { id },
            data: {
                status: EmailStatus.RETRYING,
                retryCount: attempts,
                errorMessage: errorMessage.slice(0, 500),
            },
        });
    }

    async markFailed(
        id: string,
        attempts: number,
        errorMessage: string
    ): Promise<void> {
        await this.databaseService.emailHistory.update({
            where: { id },
            data: {
                status: EmailStatus.FAILED,
                retryCount: attempts,
                errorMessage: errorMessage.slice(0, 500),
            },
        });
    }
}
