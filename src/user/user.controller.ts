import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from './entities';
import { UserService } from './user.service';
import {
  SetOficialTokenDto,
  SetUnofficialTokenDto,
  SetLinkedinCredentialsDto,
} from './dtos';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('AccessToken')
  @UseGuards(JwtAuthGuard)
  @Post('linkedin/official-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set the official LinkedIn API token' })
  @ApiResponse({ status: 204, description: 'Official token updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setOficialToken(
    @CurrentUser() user: User,
    @Body() dto: SetOficialTokenDto,
  ): Promise<void> {
    await this.userService.setOficialToken(user.id, dto.oficialToken);
  }

  @ApiBearerAuth('AccessToken')
  @UseGuards(JwtAuthGuard)
  @Post('linkedin/unofficial-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set the unofficial (reversed) LinkedIn API token' })
  @ApiResponse({ status: 204, description: 'Unofficial token updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setUnofficialToken(
    @CurrentUser() user: User,
    @Body() dto: SetUnofficialTokenDto,
  ): Promise<void> {
    await this.userService.setUnofficialToken(user.id, dto.unofficialToken);
  }

  @ApiBearerAuth('AccessToken')
  @UseGuards(JwtAuthGuard)
  @Post('linkedin/credentials')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Set LinkedIn credentials for reversed API authentication',
    description: 'Stores LinkedIn email and password. Password is encrypted with AES-256-GCM before storage.',
  })
  @ApiResponse({ status: 204, description: 'LinkedIn credentials saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setLinkedinCredentials(
    @CurrentUser() user: User,
    @Body() dto: SetLinkedinCredentialsDto,
  ): Promise<void> {
    await this.userService.setLinkedinCredentials(
      user.id,
      dto.linkedinEmail,
      dto.linkedinPassword,
    );
  }
}
