import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user';
import { TokenPayloadDto } from '../dtos';
import { User } from '../../user/entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || '',
    });
  }

  async validate(payload: TokenPayloadDto): Promise<User> {
    const user = await this.userService.findByIdAndTokenVersion(
      payload.id,
      payload.tokenVersion,
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
