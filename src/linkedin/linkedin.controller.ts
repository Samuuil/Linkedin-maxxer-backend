import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostService } from './post/postComment.service';
import { GetFeedService } from './getFeed/getFeed.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../user/entities';

@ApiTags('LinkedIn')
@Controller('linkedin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('AccessToken')
export class LinkedInController {
  constructor(
    private postService: PostService,
    private getFeedService: GetFeedService,
  ) {}

  @Post('post')
  @ApiOperation({ summary: 'Create a text-only LinkedIn post' })
  async createPost(
    @CurrentUser() user: User,
    @Body('text') text: string,
    @Body('visibility') visibility?: 'PUBLIC' | 'CONNECTIONS',
  ) {
    const postId = await this.postService.createPost(
      user.id,
      text,
      visibility,
    );
    return { postId };
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get LinkedIn feed for current user' })
  async getFeed(
    @CurrentUser() user: User,
    @Query('count') count?: number,
  ) {
    const feed = await this.getFeedService.getFeed(
      user.id,
      count ? parseInt(count.toString()) : 10,
    );
    return feed;
  }
}