import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LinkedInAuthService } from './auth/auth.service';
import { PostService } from './post/postComment.service';
import { GetFeedService } from './getFeed/getFeed.service';
import { LinkedInController } from './linkedin.controller';
import { UserModule } from '../user';
import { AuthModule } from '../auth';

@Module({
  imports: [ConfigModule, UserModule, AuthModule],
  controllers: [LinkedInController],
  providers: [LinkedInAuthService, PostService, GetFeedService],
  exports: [LinkedInAuthService, PostService, GetFeedService],
})
export class LinkedInModule {}
