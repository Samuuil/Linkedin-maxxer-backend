import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

import { RefreshTokenPayloadDto } from '../dtos';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || '',
      ignoreExpiration: false,
    });
  }

  async validate(payload: RefreshTokenPayloadDto) {
    const user = await this.userService.findByIdAndTokenVersion(
      payload.id,
      payload.tokenVersion,
    );
    if (!user) {
      return null;
    }
    return user;
  }
}
