import { HttpStatus } from '@nestjs/common';

import { type PrismaErrorResponse } from '../interfaces/response.interface';

export const RESPONSE_SERIALIZATION_META_KEY = 'ResponseSerializationMetaKey';
export const RESPONSE_MESSAGE_META_KEY = 'ResponseMessageMetaKey';
export const RESPONSE_PAGINATED_META_KEY = 'ResponsePaginatedMetaKey';

export const HTTP_SUCCESS_MESSAGES: Record<number, string> = {
    200: '请求成功',
    201: '创建成功',
    202: '已接受',
    204: '无内容',
    206: '部分内容',
};

export const HTTP_ERROR_MESSAGES: Record<number, string> = {
    400: '请求错误',
    401: '未授权',
    403: '禁止访问',
    404: '未找到资源',
    405: '方法不允许',
    409: '冲突',
    500: '服务器内部错误',
    501: '未实现',
    502: '网关错误',
    503: '服务不可用',
};

export const PRISMA_ERROR_RESPONSES: PrismaErrorResponse = {
    P2000: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '请求参数超出允许范围',
    },
    P2001: { statusCode: HttpStatus.NOT_FOUND, message: '记录不存在' },
    P2002: {
        statusCode: HttpStatus.CONFLICT,
        message: '数据已存在，请检查后重试',
    },
    P2003: {
        statusCode: HttpStatus.CONFLICT,
        message: '关联数据不存在或仍被占用',
    },
    P2011: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '必填字段不能为空',
    },
    P2014: {
        statusCode: HttpStatus.CONFLICT,
        message: '关联数据不存在或仍被占用',
    },
    P2020: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '请求参数超出允许范围',
    },
    P2024: {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: '数据库繁忙，请稍后重试',
    },
    P2025: { statusCode: HttpStatus.NOT_FOUND, message: '记录不存在' },
    P2028: {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: '事务处理失败，请稍后重试',
    },
    P2034: {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: '数据写入冲突，请稍后重试',
    },
};

export const PRISMA_CONNECTION_ERROR_CODES: ReadonlySet<string> = new Set([
    'P1001',
    'P1002',
    'P1008',
    'P1017',
]);

export const PRISMA_DEFAULT_MESSAGE = '数据库操作失败';
