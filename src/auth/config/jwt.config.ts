import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions, JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

export const jwtAsyncConfig: JwtModuleAsyncOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<JwtModuleOptions> => ({
    secret: configService.get<string>('JWT_ACCESS_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
      ) as StringValue,
    },
  }),
  inject: [ConfigService],
};
