import { type EmailType } from '@prisma/client';

export interface IEmailSendOptions {
    to: string;
    subject: string;
    html: string;
}

export interface IEmailCodeJob {
    historyId: string;
    email: string;
    scene: EmailType;
    code: string;
}

export interface IEmailSceneCopy {
    subject: string;
    title: string;
    intro: string;
    notice: string;
}

export interface IEnqueueCodeEmail {
    email: string;
    scene: EmailType;
    code: string;
    userId?: string;
}

export interface ICreatePendingEmail {
    email: string;
    scene: EmailType;
    userId?: string;
}
