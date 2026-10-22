export const NEST_BOOTSTRAP_CONTEXTS: ReadonlySet<string> = new Set([
    'NestFactory',
    'InstanceLoader',
    'RoutesResolver',
    'RouterExplorer',
    'NestApplication',
]);

export const SENSITIVE_PATHS: string[] = [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers["x-api-key"]',
    'req.body.password',
    'req.body.confirmPassword',
    'req.body.currentPassword',
    'req.body.newPassword',
    'req.body.token',
    'req.body.refreshToken',
    'req.body.accessToken',
    'req.body.secret',
    'req.body.apiKey',
    'req.body.cardNumber',
    'req.body.cvv',
    'req.body.ssn',
    'res.headers["set-cookie"]',
    'body.data.accessToken',
    'body.data.refreshToken',
    'body.data.user.passwordHash',
];
