import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findByLinkedinSub(linkedinSub: string): Promise<User | null> {
    return this.findOne({ where: { linkedinSub } });
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne({ where: { id } });
  }

  async createUser(
    email: string,
    linkedinSub: string,
    linkedinRefreshToken: string,
    linkedinUsername?: string,
  ): Promise<User> {
    const user = this.create({
      email,
      linkedinSub,
      linkedinRefreshToken,
      linkedinUsername,
    });
    return this.save(user);
  }

  async updateLinkedinRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.update(userId, { linkedinRefreshToken: refreshToken });
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.update(userId, { pushToken });
  }
}
