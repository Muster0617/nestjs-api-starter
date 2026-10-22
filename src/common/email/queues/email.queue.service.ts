import { InjectQueue } from '@nestjs/bullmq';
import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { type EmailConfig, type IAppConfiguration } from 'src/common/config';

import { EMAIL_JOB_SEND_CODE, EMAIL_QUEUE } from '../constants/email.constant';
import {
    type IEmailCodeJob,
    type IEnqueueCodeEmail,
} from '../interfaces/email.interface';
import { EmailHistoryService } from '../services/email-history.service';

export function describeError(error: unknown): string {
    if (error instanceof Error && error.cause instanceof Error) {
        return `${error.message}: ${error.cause.message}`;
    }

    return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class EmailQueueService {
    private readonly logger = new Logger(EmailQueueService.name);
    private readonly attempts: number;
    private readonly backoffDelayMs: number;

    constructor(
        @InjectQueue(EMAIL_QUEUE)
        private readonly emailQueue: Queue<IEmailCodeJob>,
        private readonly emailHistoryService: EmailHistoryService,
        configService: ConfigService<IAppConfiguration, true>
    ) {
        const config = configService.getOrThrow<EmailConfig>('email');

        this.attempts = config.queue.attempts;
        this.backoffDelayMs = config.queue.backoffDelayMs;
    }

    async enqueueVerificationCode(input: IEnqueueCodeEmail): Promise<void> {
        const history = await this.emailHistoryService.createPending({
            email: input.email,
            scene: input.scene,
            userId: input.userId,
        });

        try {
            await this.emailQueue.add(
                EMAIL_JOB_SEND_CODE,
                {
                    historyId: history.id,
                    email: input.email,
                    scene: input.scene,
                    code: input.code,
                },
                {
                    attempts: this.attempts,
                    backoff: {
                        type: 'exponential',
                        delay: this.backoffDelayMs,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                }
            );
        } catch (error) {
            const message = describeError(error);
            this.logger.error(
                `验证码邮件入队失败: ${input.email} <${history.subject}>`,
                message
            );
            await this.emailHistoryService.markFailed(history.id, 0, message);
            throw new BadGatewayException('验证码邮件投递失败，请稍后重试');
        }
    }
}
