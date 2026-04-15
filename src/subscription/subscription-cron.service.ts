import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionRepository } from './subscription.repository';
import { CommentSuggestionRepository } from './comment-suggestion.repository';
import { LinkedinPostService } from '../linkedin/post/postComment.service';
import { LinkedInUserPost } from '../linkedin/interfaces/linkedin.interface';
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
    private readonly postService: LinkedinPostService,
    private readonly openAiService: OpenAiService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  @Cron('0 */5 * * * *')
  async processSubscriptions() {
    this.logger.log('Starting subscription cron job');

    const userIds = await this.subscriptionRepository.getAllUniqueUserIds();

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
    this.logger.log(
      `Processing subscription for user=${subscription.userId} linkedin=${subscription.linkedinUsername}`,
    );

    const posts = await this.postService.getUserOfficialLinkedPosts(
      subscription.linkedinUsername,
    );

    this.logger.log(
      `Fetched ${posts.length} posts for ${subscription.linkedinUsername}`,
    );

    if (posts.length > 0) {
      const sample = posts[0];
      this.logger.debug(
        `First post raw timestamp=${sample.posted_at?.timestamp} parsed=${new Date(sample.posted_at?.timestamp)} url=${sample.url}`,
      );
    }

    const now = Date.now();
    const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);

    const recentPosts = posts.filter((post: LinkedInUserPost) => {
      const raw = post.posted_at?.timestamp;
      // LinkedIn may return seconds; normalise to ms if the value looks like seconds
      const ms = raw > 1e12 ? raw : raw * 1000;
      const postDate = new Date(ms);
      const isRecent = postDate > fifteenMinutesAgo;
      this.logger.debug(
        `Post url=${post.url} raw=${raw} ms=${ms} postDate=${postDate.toISOString()} isRecent=${isRecent}`,
      );
      return isRecent;
    });

    this.logger.log(
      `${recentPosts.length} recent post(s) found for ${subscription.linkedinUsername}`,
    );

    for (const post of recentPosts) {
      const alreadyProcessed =
        await this.commentSuggestionRepository.existsByPostAndUser(
          subscription.userId,
          post.url,
        );

      this.logger.log(`Post ${post.url} alreadyProcessed=${alreadyProcessed}`);

      if (alreadyProcessed) continue;

      const suggestedComment = await this.openAiService.generateComment(
        post.text,
      );

      const suggestion = this.commentSuggestionRepository.create({
        userId: subscription.userId,
        linkedinPostId: post.url,
        linkedinUsername: subscription.linkedinUsername,
        postDescription: post.text,
        suggestedComment,
        status: subscription.autoComment
          ? CommentSuggestionStatus.AUTO_POSTED
          : CommentSuggestionStatus.PENDING,
      });

      await this.commentSuggestionRepository.save(suggestion);

      if (subscription.autoComment) {
        this.logger.log(`Auto-commenting on post ${post.url}`);
        await this.postService.commentOnPost(
          post.url,
          suggestedComment,
          subscription.userId,
        );
      } else if (pushToken) {
        this.logger.log(
          `Sending push notification to token ${pushToken} for post ${post.url}`,
        );
        await this.notificationService.sendToToken(
          pushToken,
          'New Comment Suggestion',
          `New post from ${subscription.linkedinUsername}: "${post.text.substring(0, 100)}..."`,
          NotificationTypeEnum.CommentSuggestion,
          { suggestionId: suggestion.id },
        );
      } else {
        this.logger.warn(
          `No push token for user=${subscription.userId}, skipping notification`,
        );
      }
    }
  }
}
