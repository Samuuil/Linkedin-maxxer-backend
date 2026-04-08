import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user';
import { User } from '../user/entities';
import * as argon2 from 'argon2';

import { RegisterDto } from './dtos';
import { AuthErrorCodes } from './errors';
import { UserErrorCodes } from '../user/errors';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('JWT_DEFAULT') private readonly jwtDefault: JwtService,
    @Inject('JWT_REFRESH') private readonly jwtRefresh: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException(
        UserErrorCodes.UserWithThisEmailAlreadyCreatedError,
      );
    }

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.userService.createUserWithPassword(
      dto.email,
      hashedPassword,
    );
    this.logger.log(`New user registered: ${user.id} (${user.email})`);
    return this.generateTokens(user);
  }

  async login(user: User) {
    this.logger.log(`User logged in: ${user.id} (${user.email})`);
    return this.generateTokens(user);
  }

  async refreshAccessToken(user: User) {
    return this.generateTokens(user);
  }

  async logout(user: User) {
    await this.userService.incrementTokenVersion(user.id);
    this.logger.log(`User logged out: ${user.id}`);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }
    if (await argon2.verify(user.password, password)) {
      return user;
    }
    return null;
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.userService.updatePushToken(userId, pushToken);
    this.logger.log(`Push token updated for user: ${userId}`);
  }

  async getProfile(userId: string): Promise<User> {
    return this.userService.findByIdOrFail(userId);
  }

  getLinkedinAuthorizationUrl(): string {
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

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  private async generateTokens(user: User) {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      id: user.id,
      tokenVersion: user.tokenVersion,
    };
    return this.jwtDefault.sign(payload);
  }

  private async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      id: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };
    return this.jwtRefresh.sign(payload);
  }
}
