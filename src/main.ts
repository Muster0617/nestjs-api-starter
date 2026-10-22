import 'reflect-metadata';

import { StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { type AppConfig, type IAppConfiguration } from 'src/common/config';

import { AppModule } from './app/app.module';
import setupSwagger from './swagger';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
    });

    const config =
        app.get<ConfigService<IAppConfiguration, true>>(ConfigService);
    const logger = app.get(Logger);
    const appConfig = config.getOrThrow<AppConfig>('app');
    const host = appConfig.http.host;
    const port = appConfig.http.port;

    app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.path === '/favicon.ico') return res.sendStatus(204);
        next();
    });
    app.use(helmet());
    app.use(compression());
    app.useLogger(logger);
    app.enableCors(appConfig.cors);
    app.set('trust proxy', true);

    app.useGlobalPipes(new StandardSchemaValidationPipe());

    app.setGlobalPrefix('api');

    if (appConfig.env !== 'production') {
        setupSwagger(app);
    }

    app.enableShutdownHooks();

    await app.listen(port, host);
    logger.log(`服务运行于: ${await app.getUrl()}`);
}

bootstrap().catch(err => {
    console.error('服务器启动失败:', err);
    process.exit(1);
});
