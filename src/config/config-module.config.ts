import Joi from 'joi';
import { ConfigModuleOptions } from '@nestjs/config';

export const configModuleConfig: ConfigModuleOptions = {
  isGlobal: true,
  validationSchema: Joi.object({
    ENV: Joi.string().valid('DEV', 'PROD').default('DEV'),
    PORT: Joi.number().default(3000),

    DATABASE_HOST: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_PORT: Joi.number().required(),
    DATABASE_LOGGING: Joi.boolean().default(false),
  }),
};
