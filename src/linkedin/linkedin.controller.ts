import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PostService } from './post/postComment.service';
import { GetFeedService } from './getFeed/getFeed.service';
import { AuthService } from './auth/auth.service';

@Controller('linkedin')
export class LinkedInController {
  constructor(
    private authService: AuthService,
    private postService: PostService,
    private getFeedService: GetFeedService,
  ) {}

  @Post('auth/token')
  async getToken(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.getAccessTokenAndUrn(refreshToken);
    return result;
  }

  @Post('post')
  async createPost(
    @Body('refreshToken') refreshToken: string,
    @Body('text') text: string,
    @Body('visibility') visibility?: 'PUBLIC' | 'CONNECTIONS',
  ) {
    const postId = await this.postService.postCommentToArticle(
      refreshToken,
      text,
      visibility,
    );
    return { postId };
  }

  @Get('feed')
  async getFeed(
    @Query('refreshToken') refreshToken: string,
    @Query('count') count?: number,
  ) {
    const feed = await this.getFeedService.getFeed(
      refreshToken,
      count ? parseInt(count.toString()) : 10,
    );
    return feed;
  }
}
