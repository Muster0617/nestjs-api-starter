import { type IncomingMessage, type ServerResponse } from 'node:http';

import { type LoggerOptions } from 'pino';

export type AuthenticatedRequest = IncomingMessage & {
    id?: string | number;
    body?: unknown;
    user?: { userId?: string };
    ip?: string;
};

export type TrackedError = Error & {
    code?: string;
    statusCode?: number;
};

export type HttpResponseWithLocals = ServerResponse & {
    locals?: { responseBody?: unknown };
};

export type LogMethodHook = NonNullable<LoggerOptions['hooks']>['logMethod'];

export type LogMethodArgs = Parameters<NonNullable<LogMethodHook>>[0];

export interface IRequestLogContext {
    correlationId?: string | number;
    traceId?: string;
    userId?: string;
    body?: unknown;
}
