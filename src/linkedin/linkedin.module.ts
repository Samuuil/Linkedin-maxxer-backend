import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import { PostService } from './post/postComment.service';
import { GetFeedService } from './getFeed/getFeed.service';
import { LinkedInController } from './linkedin.controller';

@Module({
  imports: [ConfigModule],
  controllers: [LinkedInController],
  providers: [AuthService, PostService, GetFeedService],
  exports: [AuthService, PostService, GetFeedService],
})
export class LinkedInModule {}
