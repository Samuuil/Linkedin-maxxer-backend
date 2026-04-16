import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entities';
import { CryptoService } from '../crypto';
import { UserErrorCodes } from './errors';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cryptoService: CryptoService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByEmailOrFail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(UserErrorCodes.UserNotFoundError);
    }
    return user;
  }

  async findByLinkedinSub(linkedinSub: string): Promise<User | null> {
    return this.userRepository.findByLinkedinSub(linkedinSub);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(UserErrorCodes.UserNotFoundError);
    }
    return user;
  }

  async findByIdAndTokenVersion(
    id: string,
    tokenVersion: number,
  ): Promise<User | null> {
    return this.userRepository.findByIdAndTokenVersion(id, tokenVersion);
  }

  async createUserWithPassword(
    email: string,
    hashedPassword: string,
  ): Promise<User> {
    return this.userRepository.createUserWithPassword(email, hashedPassword);
  }

  async createUser(
    email: string,
    linkedinSub: string,
    linkedinUsername?: string,
  ): Promise<User> {
    return this.userRepository.createUser(
      email,
      linkedinSub,
      linkedinUsername,
    );
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.userRepository.updatePushToken(userId, pushToken);
  }

  async clearPushToken(pushToken: string): Promise<void> {
    await this.userRepository.clearPushToken(pushToken);
  }

  async setOficialToken(userId: string, token: string): Promise<void> {
    await this.userRepository.updateOficialToken(userId, token);
  }

  async setUnofficialToken(userId: string, token: string): Promise<void> {
    await this.userRepository.updateUnofficialToken(userId, token);
  }

  async setLinkedinCredentials(
    userId: string,
    linkedinEmail: string,
    linkedinPassword: string,
  ): Promise<void> {
    const encryptedPassword = this.cryptoService.encrypt(linkedinPassword);
    await this.userRepository.updateLinkedinCredentials(
      userId,
      linkedinEmail,
      encryptedPassword,
    );
  }

  async getOficialToken(userId: string): Promise<string | null> {
    const user = await this.findByIdOrFail(userId);
    return user.oficialToken || null;
  }

  async getUnofficialToken(userId: string): Promise<string | null> {
    const user = await this.findByIdOrFail(userId);
    return user.unofficialToken || null;
  }

  async getLinkedinEmail(userId: string): Promise<string | null> {
    const user = await this.findByIdOrFail(userId);
    return user.linkedinEmail || null;
  }

  async getLinkedinPassword(userId: string): Promise<string | null> {
    const user = await this.findByIdOrFail(userId);
    if (!user.linkedinPassword) return null;
    return this.cryptoService.decrypt(user.linkedinPassword);
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.userRepository.incrementTokenVersion(userId);
  }

  async saveUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
