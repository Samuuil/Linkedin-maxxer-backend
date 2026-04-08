import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export type JwtConfigFactory = (
  configService: ConfigService,
) => Promise<JwtModuleOptions>;
