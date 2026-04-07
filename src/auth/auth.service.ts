import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user';
import { AuthService as LinkedInAuthService } from '../linkedin/auth/auth.service';
import { User } from '../user/entities';
import { AuthResponseDto, JwtPayloadDto } from './dtos';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly linkedInAuthService: LinkedInAuthService,
  ) {}

  async handleLinkedInCallback(code: string): Promise<AuthResponseDto> {
    try {
      const redirectUri =
        this.configService.get<string>('LINKEDIN_REDIRECT_URI') ||
        'https://www.linkedin.com/developers/tools/oauth/redirect';

      const { accessToken, refreshToken } =
        await this.linkedInAuthService.exchangeCodeForTokens(code, redirectUri);

      const userInfo =
        await this.linkedInAuthService.getUserInfo(accessToken);

      if (!userInfo.email) {
        throw new BadRequestException(
          'Email not provided by LinkedIn. Please ensure email scope is granted.',
        );
      }

      let user = await this.userService.findByLinkedinSub(userInfo.sub);

      if (!user) {
        user = await this.userService.createUser(
          userInfo.email,
          userInfo.sub,
          refreshToken,
          userInfo.name || userInfo.given_name,
        );
        this.logger.log(`New user created: ${user.id} (${user.email})`);
      } else {
        await this.userService.updateLinkedinRefreshToken(user.id, refreshToken);
        this.logger.log(`Existing user logged in: ${user.id} (${user.email})`);
      }

      const jwtToken = this.generateJwtToken(user);

      return {
        accessToken: jwtToken,
        userId: user.id,
        email: user.email,
        linkedinUsername: user.linkedinUsername || undefined,
      };
    } catch (error: any) {
      this.logger.error('LinkedIn callback failed', error.message);
      throw new UnauthorizedException('Failed to authenticate with LinkedIn');
    }
  }

  generateJwtToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  async updatePushToken(
    userId: string,
    pushToken: string,
  ): Promise<void> {
    await this.userService.updatePushToken(userId, pushToken);
    this.logger.log(`Push token updated for user: ${userId}`);
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  getAuthorizationUrl(state?: string): string {
    const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
    const redirectUri =
      this.configService.get<string>('LINKEDIN_REDIRECT_URI') ||
      'https://www.linkedin.com/developers/tools/oauth/redirect';
    const scope = 'openid profile email w_member_social';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      redirect_uri: redirectUri,
      scope,
    });

    if (state) {
      params.append('state', state);
    }

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }
}
