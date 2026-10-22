import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
    BadGatewayException,
    Injectable,
    InternalServerErrorException,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

import { type EmailConfig, type IAppConfiguration } from 'src/common/config';

import { EMAIL_TEMPLATE_FILE, HTML_ESCAPES } from '../constants/email.constant';
import { type IEmailSendOptions } from '../interfaces/email.interface';

const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, char => HTML_ESCAPES[char]);

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly host: string;
    private readonly port: number;
    private readonly user: string;
    private readonly password: string;
    private readonly from: string;
    private readonly templateDir: string;
    private transporter?: Transporter;

    constructor(configService: ConfigService<IAppConfiguration, true>) {
        const config = configService.getOrThrow<EmailConfig>('email');

        this.host = config.host;
        this.port = config.port;
        this.user = config.user;
        this.password = config.password;
        this.from = config.from;
        this.templateDir = config.templateDir;
    }

    async renderTemplate(vars: Record<string, string>): Promise<string> {
        const file = join(this.templateDir, EMAIL_TEMPLATE_FILE);
        let raw: string;
        try {
            raw = await readFile(file, 'utf-8');
        } catch {
            this.logger.error(`邮件模板读取失败: ${file}`);
            throw new InternalServerErrorException('邮件模板不可用');
        }

        return raw.replace(
            /\{\{\s*(\w+)\s*\}\}/g,
            (match, key: string): string =>
                Object.hasOwn(vars, key) ? escapeHtml(String(vars[key])) : match
        );
    }

    async send(options: IEmailSendOptions): Promise<string> {
        let messageId: string;
        try {
            const info = await this.getTransporter().sendMail({
                from: this.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            messageId = info.messageId ?? '';
        } catch (error) {
            this.logger.error(
                `邮件发送失败: ${options.to} <${options.subject}>`,
                error instanceof Error ? error.stack : String(error)
            );
            throw new BadGatewayException('邮件发送失败', { cause: error });
        }

        this.logger.log(`邮件已发送: ${options.to} <${options.subject}>`);
        return messageId;
    }

    private getTransporter(): Transporter {
        if (this.transporter) return this.transporter;

        if (!this.host || !this.user) {
            throw new ServiceUnavailableException(
                '邮件服务未配置，请检查 EMAIL_HOST / EMAIL_USER'
            );
        }

        this.transporter = createTransport({
            host: this.host,
            port: this.port,
            secure: this.port === 465,
            auth: { user: this.user, pass: this.password },
        });
        return this.transporter;
    }
}
