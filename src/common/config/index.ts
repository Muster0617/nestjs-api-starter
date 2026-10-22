import { type ConfigType } from '@nestjs/config';

import appConfig from './app.config';
import authConfig from './auth.config';
import databaseConfig from './database.config';
import docConfig from './doc.config';
import emailConfig from './email.config';
import redisConfig from './redis.config';

export type AppConfig = ConfigType<typeof appConfig>;
export type AuthConfig = ConfigType<typeof authConfig>;
export type DatabaseConfig = ConfigType<typeof databaseConfig>;
export type DocConfig = ConfigType<typeof docConfig>;
export type EmailConfig = ConfigType<typeof emailConfig>;
export type RedisConfig = ConfigType<typeof redisConfig>;

export interface IAppConfiguration {
    app: AppConfig;
    auth: AuthConfig;
    database: DatabaseConfig;
    doc: DocConfig;
    email: EmailConfig;
    redis: RedisConfig;
}

export default [
    appConfig,
    authConfig,
    databaseConfig,
    docConfig,
    emailConfig,
    redisConfig,
];
