export const PUBLIC_ROUTE_KEY = 'Public';

export const ROLES_DECORATOR_KEY = 'Roles';

export const AUTH_ERROR_MESSAGES = {
    accessToken: {
        missing: '访问令牌无效或缺失',
        invalid: '访问令牌已失效，请重新登录',
    },
    refreshToken: {
        missing: '刷新令牌无效或缺失',
        invalid: '刷新令牌已失效，请重新登录',
    },
} as const;

export const RATE_LIMIT_ERROR_MESSAGE = '请求过于频繁，请稍后再试';
