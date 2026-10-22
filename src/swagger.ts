import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { type DocConfig, type IAppConfiguration } from 'src/common/config';

export default function setupSwagger(app: INestApplication): void {
    const configService =
        app.get<ConfigService<IAppConfiguration, true>>(ConfigService);
    const config = configService.getOrThrow<DocConfig>('doc');

    const documentBuild = new DocumentBuilder()
        .addTag('Auth', '权限模块')
        .addTag('User', '用户模块')
        .addTag('Health', '健康模块')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'accessToken',
                description: '请输入访问令牌',
                in: 'header',
            },
            'accessToken'
        )
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'refreshToken',
                description: '请输入刷新令牌',
                in: 'header',
            },
            'refreshToken'
        )
        .build();

    const document = SwaggerModule.createDocument(app, documentBuild, {
        deepScanRoutes: true,
    });

    SwaggerModule.setup(config.path, app, document, {
        explorer: true,
        customCss: [
            '.swagger-ui .information-container .info { margin: 0; }',
            '.swagger-ui .info .main { display: none; }',
            '.swagger-ui .scheme-container { background: transparent; }',
        ].join(''),
        swaggerOptions: {
            docExpansion: 'none',
            persistAuthorization: true,
            displayOperationId: true,
            operationsSorter: 'method',
            tagsSorter: 'alpha',
            tryItOutEnabled: true,
            filter: true,
        },
    });
}
