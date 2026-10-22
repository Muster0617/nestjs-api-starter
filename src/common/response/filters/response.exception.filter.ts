import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { type Request, type Response } from 'express';

import { type AppConfig, type IAppConfiguration } from 'src/common/config';

import {
    HTTP_ERROR_MESSAGES,
    PRISMA_CONNECTION_ERROR_CODES,
    PRISMA_DEFAULT_MESSAGE,
    PRISMA_ERROR_RESPONSES,
} from '../constants/response.constant';
import {
    type IApiErrorResponse,
    type IResolvedException,
} from '../interfaces/response.interface';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ResponseExceptionFilter.name);
    private readonly isDebug: boolean;

    constructor(configService: ConfigService<IAppConfiguration, true>) {
        this.isDebug =
            configService.getOrThrow<AppConfig>('app').env !== 'production';
    }

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const { statusCode, message, validationMessages, prismaCode } =
            this.resolveException(exception);

        const errorResponse: IApiErrorResponse = {
            statusCode,
            message,
            timestamp: new Date().toISOString(),
        };

        if (this.isDebug) {
            if (validationMessages) {
                errorResponse.error = validationMessages;
            } else if (prismaCode) {
                errorResponse.error = { code: prismaCode };
            } else if (exception instanceof Error) {
                errorResponse.error = exception.stack;
            }
        }

        if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `${request.method} ${request.url} - ${statusCode}: ${message}${
                    prismaCode ? ` [${prismaCode}]` : ''
                }`,
                exception instanceof Error ? exception.stack : undefined
            );
        }

        response.locals.responseBody = errorResponse;
        response.status(statusCode).json(errorResponse);
    }

    private resolveException(exception: unknown): IResolvedException {
        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            const mapped = PRISMA_ERROR_RESPONSES[exception.code];

            return mapped
                ? { ...mapped, prismaCode: exception.code }
                : {
                      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                      message: PRISMA_DEFAULT_MESSAGE,
                      prismaCode: exception.code,
                  };
        }

        if (exception instanceof Prisma.PrismaClientInitializationError) {
            const isConnectionError =
                !exception.errorCode ||
                PRISMA_CONNECTION_ERROR_CODES.has(exception.errorCode);

            return {
                statusCode: isConnectionError
                    ? HttpStatus.SERVICE_UNAVAILABLE
                    : HttpStatus.INTERNAL_SERVER_ERROR,
                message: isConnectionError
                    ? '数据库连接不可用，请稍后重试'
                    : PRISMA_DEFAULT_MESSAGE,
                prismaCode: exception.errorCode,
            };
        }

        if (exception instanceof Prisma.PrismaClientValidationError) {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message: '请求参数不合法',
            };
        }

        if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: PRISMA_DEFAULT_MESSAGE,
            };
        }

        if (exception instanceof BadRequestException) {
            const body = exception.getResponse() as {
                message?: string | string[];
            };

            if (Array.isArray(body.message)) {
                return {
                    statusCode: exception.getStatus(),
                    message:
                        HTTP_ERROR_MESSAGES[exception.getStatus()] ??
                        '请求错误',
                    validationMessages: body.message,
                };
            }

            return {
                statusCode: exception.getStatus(),
                message:
                    body.message ??
                    HTTP_ERROR_MESSAGES[exception.getStatus()] ??
                    '请求错误',
            };
        }

        if (exception instanceof HttpException) {
            return {
                statusCode: exception.getStatus(),
                message: exception.message,
            };
        }

        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: HTTP_ERROR_MESSAGES[500] ?? '服务器内部错误',
        };
    }
}
