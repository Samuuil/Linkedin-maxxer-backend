import Joi from 'joi';
import { ConfigModuleOptions } from '@nestjs/config';

export const configModuleConfig: ConfigModuleOptions = {
  isGlobal: true,
  validationSchema: Joi.object({
    ENV: Joi.string().valid('DEV', 'PROD').default('DEV'),
    PORT: Joi.number().default(3000),
    SWAGGER_ENABLED: Joi.boolean().default(true),

    DATABASE_HOST: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_PORT: Joi.number().required(),
    DATABASE_LOGGING: Joi.boolean().default(false),

    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default('1d'),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

    ENCRYPTION_KEY: Joi.string().length(64).required(),

    FIREBASE_PROJECT_ID: Joi.string().required(),
    FIREBASE_CLIENT_EMAIL: Joi.string().required(),
    FIREBASE_PRIVATE_KEY: Joi.string().required().replace(/\\n/g, '\n'),

    OPENAI_API_KEY: Joi.string().required(),
  }),
};
