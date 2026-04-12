import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../user/entities';
import { SubscriptionService } from './subscription.service';
import {
  SubscribeDto,
  RespondSuggestionDto,
  ToggleAutoCommentDto,
} from './dtos';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('AccessToken')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Subscribe to a LinkedIn user by URL' })
  @ApiResponse({ status: 201, description: 'Subscribed successfully' })
  async subscribe(
    @CurrentUser() user: User,
    @Body() dto: SubscribeDto,
  ) {
    return this.subscriptionService.subscribe(user.id, dto.linkedinUrl);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unsubscribe from a LinkedIn user' })
  async unsubscribe(
    @CurrentUser() user: User,
    @Param('id') subscriptionId: string,
  ) {
    await this.subscriptionService.unsubscribe(user.id, subscriptionId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  async getSubscriptions(@CurrentUser() user: User) {
    return this.subscriptionService.getSubscriptions(user.id);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get all comment suggestions' })
  async getSuggestions(@CurrentUser() user: User) {
    return this.subscriptionService.getSuggestions(user.id);
  }

  @Get('suggestions/pending')
  @ApiOperation({ summary: 'Get pending comment suggestions' })
  async getPendingSuggestions(@CurrentUser() user: User) {
    return this.subscriptionService.getPendingSuggestions(user.id);
  }

  @Post('suggestions/respond')
  @ApiOperation({ summary: 'Approve or reject a comment suggestion' })
  async respondToSuggestion(
    @CurrentUser() user: User,
    @Body() dto: RespondSuggestionDto,
  ) {
    return this.subscriptionService.respondToSuggestion(
      user.id,
      dto.suggestionId,
      dto.approve,
    );
  }

  @Post('auto-comment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Toggle auto-comment mode for a specific subscription' })
  async toggleAutoComment(
    @CurrentUser() user: User,
    @Body() dto: ToggleAutoCommentDto,
  ) {
    await this.subscriptionService.toggleAutoComment(
      user.id,
      dto.subscriptionId,
      dto.autoComment,
    );
  }
}
