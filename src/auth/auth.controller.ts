import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import { User } from '../user/entities';
import {
  LinkedInCallbackDto,
  AuthResponseDto,
  UpdatePushTokenDto,
  UserProfileDto,
} from './dtos';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('linkedin/url')
  @ApiOperation({ summary: 'Get LinkedIn OAuth authorization URL' })
  @ApiResponse({
    status: 200,
    description: 'Returns the LinkedIn OAuth URL',
    schema: {
      properties: {
        authorizationUrl: { type: 'string' },
      },
    },
  })
  getLinkedInAuthUrl(@Query('state') state?: string): { authorizationUrl: string } {
    const authorizationUrl = this.authService.getAuthorizationUrl(state);
    return { authorizationUrl };
  }

  @Post('linkedin/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle LinkedIn OAuth callback',
    description:
      'Exchange LinkedIn authorization code for JWT access token. Creates new user or logs in existing user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code or missing email permission',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  async linkedInCallback(
    @Body() linkedInCallbackDto: LinkedInCallbackDto,
  ): Promise<AuthResponseDto> {
    return this.authService.handleLinkedInCallback(linkedInCallbackDto.code);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('AccessToken')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@CurrentUser() user: User): Promise<UserProfileDto> {
    return {
      id: user.id,
      email: user.email,
      linkedinUsername: user.linkedinUsername,
      linkedinSub: user.linkedinSub,
      pushToken: user.pushToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Post('push-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('AccessToken')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update push notification token',
    description: 'Update FCM push token for Android notifications',
  })
  @ApiResponse({
    status: 204,
    description: 'Push token updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updatePushToken(
    @CurrentUser() user: User,
    @Body() updatePushTokenDto: UpdatePushTokenDto,
  ): Promise<void> {
    await this.authService.updatePushToken(
      user.id,
      updatePushTokenDto.pushToken,
    );
  }
}
