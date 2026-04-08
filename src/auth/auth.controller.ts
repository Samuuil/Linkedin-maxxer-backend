import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard, LocalAuthGuard, RefreshAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import { User } from '../user/entities';
import {
  RegisterDto,
  LoginDto,
  UpdatePushTokenDto,
  UserProfileDto,
} from './dtos';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('linkedin/url')
  @ApiOperation({ summary: 'Get LinkedIn OAuth authorization URL' })
  @ApiResponse({
    status: 200,
    description: 'Returns the LinkedIn OAuth URL to redirect the user to',
    schema: { properties: { authorizationUrl: { type: 'string' } } },
  })
  getLinkedinAuthUrl(): { authorizationUrl: string } {
    return { authorizationUrl: this.authService.getLinkedinAuthorizationUrl() };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Email already taken or validation error' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Req() req: any) {
    return this.authService.login(req.user);
  }

  @ApiBearerAuth('AccessToken')
  @UseGuards(RefreshAuthGuard)
  @Get('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Access token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid' })
  async refreshAccessToken(@Req() req: any) {
    return this.authService.refreshAccessToken(req.user);
  }

  @ApiBearerAuth('AccessToken')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user);
    return { message: 'Logged out successfully' };
  }

  @ApiBearerAuth('AccessToken')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiBearerAuth('AccessToken')
  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update push notification token' })
  @ApiResponse({ status: 204, description: 'Push token updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
