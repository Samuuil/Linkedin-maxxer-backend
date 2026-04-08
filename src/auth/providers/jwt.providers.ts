import { Provider } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { jwtAsyncConfig, refreshAsyncConfig } from '../config';
import { JwtConfigFactory } from '../types';

function buildJwtProvider(token: string, factory: JwtConfigFactory): Provider {
  return {
    provide: token,
    useFactory: async (configService: ConfigService): Promise<JwtService> => {
      const options = await factory(configService);
      return new JwtService(options);
    },
    inject: [ConfigService],
  };
}

export const JwtProviders = [
  buildJwtProvider('JWT_DEFAULT', async (cs) => jwtAsyncConfig.useFactory!(cs)),
  buildJwtProvider('JWT_REFRESH', async (cs) =>
    refreshAsyncConfig.useFactory!(cs),
  ),
];
