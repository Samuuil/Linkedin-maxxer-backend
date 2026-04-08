import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions, JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

export const refreshAsyncConfig: JwtModuleAsyncOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<JwtModuleOptions> => ({
    secret: configService.get<string>('JWT_REFRESH_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) as StringValue,
    },
  }),
  inject: [ConfigService],
};
