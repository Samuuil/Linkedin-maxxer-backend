import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Post } from '../posts/entities';
import { Subscription, CommentSuggestion } from '../subscription/entities';
import { PostStatus } from '../posts/enums';
import { CommentSuggestionStatus } from '../subscription/enums';
import {
  DashboardActivityItemDto,
  DashboardSummaryResponseDto,
} from './dtos';
import { DashboardActivityType } from './enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(CommentSuggestion)
    private readonly commentSuggestionRepository: Repository<CommentSuggestion>,
  ) {}

  async getSummary(userId: string): Promise<DashboardSummaryResponseDto> {
    const [pendingSuggestions, subscriptionsCount, posts, suggestions] =
      await Promise.all([
        this.commentSuggestionRepository.count({
          where: { userId, status: CommentSuggestionStatus.PENDING },
        }),
        this.subscriptionRepository.find({ where: { userId } }),
        this.postsRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' },
          take: 20,
        }),
        this.commentSuggestionRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' },
          take: 20,
        }),
      ]);

    const autoCommentEnabled = subscriptionsCount.filter(
      (subscription) => subscription.autoComment,
    ).length;

    const recentGrowthPercent = await this.calculateRecentGrowthPercent(userId);

    return {
      pendingSuggestions,
      activeSubscriptions: subscriptionsCount.length,
      autoCommentEnabled,
      recentGrowthPercent,
      recentActivity: this.buildRecentActivity(posts, suggestions, 12),
    };
  }

  private async calculateRecentGrowthPercent(userId: string): Promise<number> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [currentPosts, previousPosts, currentSuggestions, previousSuggestions] =
      await Promise.all([
        this.postsRepository.count({
          where: { userId, createdAt: Between(sevenDaysAgo, now) },
        }),
        this.postsRepository.count({
          where: { userId, createdAt: Between(fourteenDaysAgo, sevenDaysAgo) },
        }),
        this.commentSuggestionRepository.count({
          where: { userId, createdAt: Between(sevenDaysAgo, now) },
        }),
        this.commentSuggestionRepository.count({
          where: { userId, createdAt: Between(fourteenDaysAgo, sevenDaysAgo) },
        }),
      ]);

    const current = currentPosts + currentSuggestions;
    const previous = previousPosts + previousSuggestions;

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 100);
  }

  private buildRecentActivity(
    posts: Post[],
    suggestions: CommentSuggestion[],
    limit: number,
  ): DashboardActivityItemDto[] {
    const postActivities: DashboardActivityItemDto[] = posts.map((post) => ({
      id: `post_${post.id}`,
      type: DashboardActivityType.POST,
      title: `${this.readablePostStatus(post.status)}: ${this.truncate(post.text, 64)}`,
      subtitle: this.formatRelativeDate(post.createdAt),
      status: post.status,
      createdAt: post.createdAt.toISOString(),
    }));

    const suggestionActivities: DashboardActivityItemDto[] = suggestions.map(
      (suggestion) => ({
        id: `suggestion_${suggestion.id}`,
        type: DashboardActivityType.SUGGESTION,
        title: `${this.readableSuggestionStatus(suggestion.status)} on ${this.truncate(suggestion.linkedinUsername, 24)}`,
        subtitle: this.truncate(suggestion.suggestedComment, 72),
        status: suggestion.status,
        createdAt: suggestion.createdAt.toISOString(),
      }),
    );

    return [...postActivities, ...suggestionActivities]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  private readablePostStatus(status: PostStatus): string {
    if (status === PostStatus.DRAFT) return 'Draft';
    if (status === PostStatus.PUBLISHED) return 'Published';
    return 'Failed';
  }

  private readableSuggestionStatus(status: CommentSuggestionStatus): string {
    if (status === CommentSuggestionStatus.PENDING) return 'Pending suggestion';
    if (status === CommentSuggestionStatus.APPROVED) return 'Approved comment';
    if (status === CommentSuggestionStatus.REJECTED) return 'Rejected suggestion';
    return 'Auto-comment';
  }

  private truncate(value: string, length: number): string {
    if (!value) return '';
    if (value.length <= length) return value;
    return `${value.slice(0, length - 3)}...`;
  }

  private formatRelativeDate(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Created just now';
    if (minutes < 60) return `Created ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `Created ${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 7) return `Created ${days} day${days === 1 ? '' : 's'} ago`;
    return `Created on ${date.toLocaleDateString('en-US')}`;
  }
}
