import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repository';
import { CommentSuggestionRepository } from './comment-suggestion.repository';
import { LinkedinPostService } from '../linkedin/post/postComment.service';
import { CommentSuggestionStatus } from './enums';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly commentSuggestionRepository: CommentSuggestionRepository,
    private readonly postService: LinkedinPostService,
  ) {}

  async subscribe(userId: string, linkedinUrl: string) {
    const username = this.extractUsername(linkedinUrl);

    const posts = await this.postService.getUserOfficialLinkedPosts(username, 1);
    if (!posts.length) {
      throw new BadRequestException('LinkedIn user not found');
    }

    const existing =
      await this.subscriptionRepository.findByUserIdAndUsername(
        userId,
        username,
      );
    if (existing) {
      throw new BadRequestException('Already subscribed to this user');
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      linkedinUsername: username,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async unsubscribe(userId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    await this.subscriptionRepository.remove(subscription);
  }

  async getSubscriptions(userId: string) {
    return this.subscriptionRepository.findByUserId(userId);
  }

  async getPendingSuggestions(userId: string) {
    return this.commentSuggestionRepository.findPendingByUserId(userId);
  }

  async getSuggestions(userId: string) {
    return this.commentSuggestionRepository.findByUserId(userId);
  }

  async respondToSuggestion(
    userId: string,
    suggestionId: string,
    approve: boolean,
  ) {
    const suggestion = await this.commentSuggestionRepository.findOne({
      where: { id: suggestionId, userId },
    });
    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }
    if (suggestion.status !== CommentSuggestionStatus.PENDING) {
      throw new BadRequestException('Suggestion already responded to');
    }

    if (approve) {
      await this.postService.commentOnPost(
        suggestion.linkedinPostId,
        suggestion.suggestedComment,
        userId,
      );
      suggestion.status = CommentSuggestionStatus.APPROVED;
    } else {
      suggestion.status = CommentSuggestionStatus.REJECTED;
    }

    return this.commentSuggestionRepository.save(suggestion);
  }

  async toggleAutoComment(
    userId: string,
    subscriptionId: string,
    autoComment: boolean,
  ) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    subscription.autoComment = autoComment;
    return this.subscriptionRepository.save(subscription);
  }

  private extractUsername(linkedinUrl: string): string {
    const match = linkedinUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];

    const cleaned = linkedinUrl.replace(/\/$/, '').trim();
    const lastSegment = cleaned.split('/').pop();
    if (lastSegment) return lastSegment;

    throw new BadRequestException('Invalid LinkedIn URL or username');
  }
}
