import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entities';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByLinkedinSub(linkedinSub: string): Promise<User | null> {
    return this.userRepository.findByLinkedinSub(linkedinSub);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async createUser(
    email: string,
    linkedinSub: string,
    linkedinRefreshToken: string,
    linkedinUsername?: string,
  ): Promise<User> {
    return this.userRepository.createUser(
      email,
      linkedinSub,
      linkedinRefreshToken,
      linkedinUsername,
    );
  }

  async updateLinkedinRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.userRepository.updateLinkedinRefreshToken(userId, refreshToken);
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.userRepository.updatePushToken(userId, pushToken);
  }
}
