import { randomUUID } from 'node:crypto';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';

import { type ConfigService } from '@nestjs/config';
import { type Params } from 'nestjs-pino';
import { type LoggerOptions } from 'pino';

import { type AppConfig, type IAppConfiguration } from 'src/common/config';

import {
    NEST_BOOTSTRAP_CONTEXTS,
    SENSITIVE_PATHS,
} from './constants/logger.constant';
import {
    type AuthenticatedRequest,
    type HttpResponseWithLocals,
    type IRequestLogContext,
    type LogMethodArgs,
    type TrackedError,
} from './interfaces/logger.interface';

const buildRequestContext = (
    req: IncomingMessage,
    res: ServerResponse
): IRequestLogContext => {
    const r = req as AuthenticatedRequest;
    return {
        correlationId: r.id,
        traceId:
            r.headers['x-trace-id']?.toString() ??
            r.headers['x-b3-traceid']?.toString() ??
            r.headers['traceparent']?.toString().split('-')[1],
        userId: r.user?.userId,
        body: (res as HttpResponseWithLocals).locals?.responseBody,
    };
};

const isNestBootstrapLog = (args: LogMethodArgs, level: number): boolean => {
    if (level >= 40) return false;

    const [first] = args;
    if (typeof first !== 'object' || first === null) return false;

    const { context } = first as { context?: unknown };
    return typeof context === 'string' && NEST_BOOTSTRAP_CONTEXTS.has(context);
};

export const createLoggerConfig = (
    configService: ConfigService<IAppConfiguration, true>
): Params => {
    const config = configService.getOrThrow<AppConfig>('app');
    const env = config.env;
    const isProduction = env === 'production';
    const logLevel = config.log.level;
    const logDir = config.log.dir;
    const logMaxFiles = config.log.maxFiles;

    return {
        pinoHttp: {
            level: logLevel,

            ...(isProduction
                ? {
                      hooks: {
                          logMethod(args, method, level) {
                              if (isNestBootstrapLog(args, level)) return;
                              method.apply(this, args);
                          },
                      } satisfies NonNullable<LoggerOptions['hooks']>,
                  }
                : {}),

            autoLogging: {
                ignore: (req: IncomingMessage) => !req.url?.startsWith('/api'),
            },

            transport: !isProduction
                ? {
                      target: 'pino-pretty',
                      options: {
                          colorize: true,
                          levelFirst: true,
                          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                          ignore: 'pid,hostname,service,environment',
                          singleLine: false,
                          messageFormat: '[{context}] {msg}',
                      },
                  }
                : {
                      targets: [
                          {
                              target: 'pino/file',
                              options: { destination: 1 },
                          },
                          {
                              target: 'pino-roll',
                              options: {
                                  file: join(logDir, 'app'),
                                  frequency: 'daily',
                                  dateFormat: 'yyyy-MM-dd',
                                  limit: { count: logMaxFiles },
                                  mkdir: true,
                              },
                          },
                      ],
                  },

            formatters: isProduction
                ? undefined
                : {
                      level: (label: string) => ({
                          level: label.toUpperCase(),
                      }),
                      bindings: () => ({}),
                  },

            timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
            messageKey: 'message',

            base: {
                service: 'nestjs-api-starter',
                environment: env,
            },

            redact: {
                paths: SENSITIVE_PATHS,
                remove: true,
            },

            customSuccessObject: (
                req: IncomingMessage,
                res: ServerResponse,
                successObject: object
            ) => ({ ...successObject, ...buildRequestContext(req, res) }),

            customErrorObject: (
                req: IncomingMessage,
                res: ServerResponse,
                _error: Error,
                errorObject: object
            ) => ({ ...errorObject, ...buildRequestContext(req, res) }),

            serializers: {
                req: (
                    req: AuthenticatedRequest & { raw?: AuthenticatedRequest }
                ) => {
                    const rawReq = req.raw ?? req;
                    return {
                        id: req.id,
                        method: req.method,
                        url: req.url,
                        path: req.url?.split('?')[0],
                        userAgent: req.headers?.['user-agent'],
                        ip: (
                            rawReq.ip ??
                            rawReq.socket?.remoteAddress ??
                            'unknown'
                        )
                            .replace(/^::ffff:/, '')
                            .replace(/%\w+$/, ''),
                        contentLength: req.headers?.['content-length'],
                        contentType: req.headers?.['content-type'],
                    };
                },
                res: (res: ServerResponse) => ({
                    statusCode: res.statusCode,
                }),
                err: (err: TrackedError) => ({
                    type: err.name,
                    code: err.code,
                    message: err.message,
                    stack: err.stack,
                }),
            },

            customLogLevel: (
                _req: IncomingMessage,
                res: ServerResponse,
                err?: Error
            ) => {
                if (err || res.statusCode >= 500) return 'error';
                if (res.statusCode >= 400) return 'warn';
                return 'info';
            },

            customSuccessMessage: (
                req: IncomingMessage,
                res: ServerResponse,
                responseTime: number
            ) => `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`,

            customErrorMessage: (
                req: IncomingMessage,
                res: ServerResponse,
                err: Error
            ) => `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,

            genReqId: (req: IncomingMessage) => {
                const r = req as AuthenticatedRequest;
                return (
                    r.id ??
                    r.headers['x-request-id']?.toString() ??
                    r.headers['x-correlation-id']?.toString() ??
                    randomUUID()
                );
            },
        },
    };
};
