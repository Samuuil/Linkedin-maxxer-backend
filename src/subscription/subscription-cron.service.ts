import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionRepository } from './subscription.repository';
import { CommentSuggestionRepository } from './comment-suggestion.repository';
import {
  LinkedInProfileService,
  LinkedInPost,
} from '../linkedin/profile/profile.service';
import { OpenAiService } from '../openai';
import { NotificationService } from '../notification/notification.service';
import { NotificationTypeEnum } from '../notification/enums';
import { UserService } from '../user';
import { Subscription } from './entities';
import { CommentSuggestionStatus } from './enums';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly commentSuggestionRepository: CommentSuggestionRepository,
    private readonly linkedInProfileService: LinkedInProfileService,
    private readonly openAiService: OpenAiService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processSubscriptions() {
    this.logger.log('Starting subscription cron job');

    const userIds =
      await this.subscriptionRepository.getAllUniqueUserIds();

    for (const userId of userIds) {
      try {
        await this.processUserSubscriptions(userId);
      } catch (error) {
        this.logger.error(
          `Failed to process subscriptions for user ${userId}`,
          error,
        );
      }
    }

    this.logger.log('Subscription cron job completed');
  }

  private async processUserSubscriptions(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) return;

    const subscriptions =
      await this.subscriptionRepository.findByUserId(userId);

    for (const subscription of subscriptions) {
      try {
        await this.processSubscription(user.pushToken, subscription);
      } catch (error) {
        this.logger.error(
          `Failed to process subscription ${subscription.id}`,
          error,
        );
      }
    }
  }

  private async processSubscription(
    pushToken: string,
    subscription: Subscription,
  ) {
    const posts =
      await this.linkedInProfileService.getUserPostsByUsername(
        subscription.linkedinUsername,
      );

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentPosts = posts.filter(
      (post: LinkedInPost) => new Date(post.createdAt) > fifteenMinutesAgo,
    );

    for (const post of recentPosts) {
      const alreadyProcessed =
        await this.commentSuggestionRepository.existsByPostAndUser(
          subscription.userId,
          post.postId,
        );
      if (alreadyProcessed) continue;

      const suggestedComment = await this.openAiService.generateComment(
        post.text,
      );

      const suggestion = this.commentSuggestionRepository.create({
        userId: subscription.userId,
        linkedinPostId: post.postId,
        linkedinUsername: subscription.linkedinUsername,
        postDescription: post.text,
        suggestedComment,
        status: subscription.autoComment
          ? CommentSuggestionStatus.AUTO_POSTED
          : CommentSuggestionStatus.PENDING,
      });

      await this.commentSuggestionRepository.save(suggestion);

      if (subscription.autoComment) {
        await this.linkedInProfileService.postCommentToPost(
          post.postId,
          suggestedComment,
        );
      } else if (pushToken) {
        await this.notificationService.sendToToken(
          pushToken,
          'New Comment Suggestion',
          `New post from ${subscription.linkedinUsername}: "${post.text.substring(0, 100)}..."`,
          NotificationTypeEnum.CommentSuggestion,
          { suggestionId: suggestion.id },
        );
      }
    }
  }
}
