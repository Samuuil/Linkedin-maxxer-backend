import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LinkedInAuthService } from './auth/auth.service';
import { LinkedinPostService } from './post/postComment.service';
import { GetFeedService } from './getFeed/getFeed.service';
import { LinkedInController } from './linkedin.controller';
import { UserModule } from '../user';
import { AuthModule } from '../auth';

@Module({
  imports: [ConfigModule, UserModule, AuthModule],
  controllers: [LinkedInController],
  providers: [LinkedInAuthService, LinkedinPostService, GetFeedService],
  exports: [LinkedInAuthService, LinkedinPostService, GetFeedService],
})
export class LinkedInModule {}
