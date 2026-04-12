import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Subscription, CommentSuggestion } from './entities';
import { SubscriptionRepository } from './subscription.repository';
import { CommentSuggestionRepository } from './comment-suggestion.repository';
import { SubscriptionService } from './subscription.service';
import { SubscriptionCronService } from './subscription-cron.service';
import { SubscriptionController } from './subscription.controller';
import { LinkedInModule } from '../linkedin/linkedin.module';
import { OpenAiModule } from '../openai';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, CommentSuggestion]),
    ScheduleModule.forRoot(),
    LinkedInModule,
    OpenAiModule,
    NotificationModule,
    UserModule,
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    SubscriptionCronService,
    SubscriptionRepository,
    CommentSuggestionRepository,
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
