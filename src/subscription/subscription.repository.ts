import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Subscription } from './entities';

@Injectable()
export class SubscriptionRepository extends Repository<Subscription> {
  constructor(private dataSource: DataSource) {
    super(Subscription, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    return this.find({ where: { userId } });
  }

  async findByUserIdAndUsername(
    userId: string,
    linkedinUsername: string,
  ): Promise<Subscription | null> {
    return this.findOne({ where: { userId, linkedinUsername } });
  }

  async getAllUniqueUserIds(): Promise<string[]> {
    const results = await this.createQueryBuilder('subscription')
      .select('DISTINCT subscription.user_id', 'userId')
      .getRawMany();
    return results.map((r) => r.userId);
  }
}
