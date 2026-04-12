import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CommentSuggestion } from './entities';
import { CommentSuggestionStatus } from './enums';

@Injectable()
export class CommentSuggestionRepository extends Repository<CommentSuggestion> {
  constructor(private dataSource: DataSource) {
    super(CommentSuggestion, dataSource.createEntityManager());
  }

  async findPendingByUserId(userId: string): Promise<CommentSuggestion[]> {
    return this.find({
      where: { userId, status: CommentSuggestionStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<CommentSuggestion[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async existsByPostAndUser(
    userId: string,
    linkedinPostId: string,
  ): Promise<boolean> {
    const count = await this.count({
      where: { userId, linkedinPostId },
    });
    return count > 0;
  }
}
