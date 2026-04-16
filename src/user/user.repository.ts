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

  async findByIdAndTokenVersion(
    id: string,
    tokenVersion: number,
  ): Promise<User | null> {
    return this.findOne({ where: { id, tokenVersion } });
  }

  async createUserWithPassword(
    email: string,
    hashedPassword: string,
  ): Promise<User> {
    const user = this.create({
      email,
      password: hashedPassword,
    });
    return this.save(user);
  }

  async createUser(
    email: string,
    linkedinSub: string,
    linkedinUsername?: string,
  ): Promise<User> {
    const user = this.create({
      email,
      linkedinSub,
      linkedinUsername,
    });
    return this.save(user);
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.update(userId, { pushToken });
  }

  async updateOficialToken(userId: string, token: string): Promise<void> {
    await this.update(userId, { oficialToken: token });
  }

  async updateUnofficialToken(userId: string, token: string): Promise<void> {
    await this.update(userId, { unofficialToken: token });
  }

  async updateLinkedinCredentials(
    userId: string,
    linkedinEmail: string,
    encryptedPassword: string,
  ): Promise<void> {
    await this.update(userId, {
      linkedinEmail,
      linkedinPassword: encryptedPassword,
    });
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.increment({ id: userId }, 'tokenVersion', 1);
  }

  async clearPushToken(pushToken: string): Promise<void> {
    await this.update({ pushToken }, { pushToken: null });
  }
}
