import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Job } from 'bullmq';

import { type EmailConfig, type IAppConfiguration } from 'src/common/config';

import { describeError } from './email.queue.service';
import { EMAIL_QUEUE, EMAIL_SCENE_COPY } from '../constants/email.constant';
import { type IEmailCodeJob } from '../interfaces/email.interface';
import { EmailHistoryService } from '../services/email-history.service';
import { EmailService } from '../services/email.service';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);
    private readonly codeTtlSeconds: number;

    constructor(
        private readonly emailService: EmailService,
        private readonly emailHistoryService: EmailHistoryService,
        configService: ConfigService<IAppConfiguration, true>
    ) {
        super();
        const config = configService.getOrThrow<EmailConfig>('email');

        this.codeTtlSeconds = config.code.ttlSeconds;
    }

    async process(job: Job<IEmailCodeJob>): Promise<void> {
        const { historyId, email, scene, code } = job.data;
        const attempt = job.attemptsMade + 1;
        const maxAttempts = job.opts.attempts ?? 1;
        const copy = EMAIL_SCENE_COPY[scene];

        if (!copy) {
            this.logger.error(
                `未知的邮件场景: ${String(scene)}，跳过 job ${job.id}`
            );
            await this.writeHistory(historyId, 'FAILED', () =>
                this.emailHistoryService.markFailed(
                    historyId,
                    attempt,
                    `未知的邮件场景: ${String(scene)}`
                )
            );
            return;
        }

        try {
            const html = await this.emailService.renderTemplate({
                title: copy.title,
                intro: copy.intro,
                notice: copy.notice,
                code,
                validMinutes: `${Math.round(this.codeTtlSeconds / 60)}`,
                year: `${new Date().getFullYear()}`,
            });
            const messageId = await this.emailService.send({
                to: email,
                subject: copy.subject,
                html,
            });
            await this.writeHistory(historyId, 'SENT', () =>
                this.emailHistoryService.markSent(historyId, messageId, attempt)
            );
        } catch (error) {
            const reason = describeError(error);
            const status = attempt < maxAttempts ? 'RETRYING' : 'FAILED';

            await this.writeHistory(historyId, status, () =>
                status === 'RETRYING'
                    ? this.emailHistoryService.markRetrying(
                          historyId,
                          attempt,
                          reason
                      )
                    : this.emailHistoryService.markFailed(
                          historyId,
                          attempt,
                          reason
                      )
            );

            throw error;
        }
    }

    private async writeHistory(
        historyId: string,
        status: 'SENT' | 'RETRYING' | 'FAILED',
        write: () => Promise<void>
    ): Promise<void> {
        try {
            await write();
        } catch (error) {
            this.logger.error(
                `发信流水回写 ${status} 失败: ${historyId}`,
                error instanceof Error ? error.stack : String(error)
            );
        }
    }
}
