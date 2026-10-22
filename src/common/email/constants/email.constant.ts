import { EmailType } from '@prisma/client';

import { type IEmailSceneCopy } from '../interfaces/email.interface';

export const EMAIL_QUEUE = 'email';

export const EMAIL_JOB_SEND_CODE = 'send-code';

export const EMAIL_TEMPLATE_FILE = 'email-code.html';

export const VERIFICATION_KEY_PREFIX = 'verification';

export const VERIFICATION_CODE_LENGTH = 6;

export const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export const EMAIL_SCENE_COPY: Record<EmailType, IEmailSceneCopy> = {
    [EmailType.SIGNUP]: {
        subject: '注册验证码',
        title: '完成账号注册',
        intro: '你正在注册账号，请填写以下验证码完成注册。',
        notice: '如果你没有发起注册，请忽略这封邮件。',
    },
    [EmailType.PASSWORD_RESET]: {
        subject: '重置密码验证码',
        title: '重置登录密码',
        intro: '你正在重置登录密码，请填写以下验证码完成操作。',
        notice: '如果你没有发起此操作，说明有人正在尝试进入你的账号，请尽快修改密码。',
    },
};
