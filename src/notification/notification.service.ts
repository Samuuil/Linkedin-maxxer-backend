import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { NotificationTypeEnum } from './enums';
import { UserService } from '../user';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly userService: UserService,
  ) {}

  /**
   * Send a notification to a single device token
   */
  async sendToToken(
    token: string,
    title: string,
    body: string,
    type: NotificationTypeEnum = NotificationTypeEnum.General,
    data?: Record<string, any>,
  ) {
    try {
      this.logger.log(`Sending notification to token: ${title}`);

      // Convert data to strings (Firebase requirement)
      const stringData = data
        ? this.convertDataToStrings({ ...data, type })
        : { type };

      await this.firebaseAdminService.sendToToken(
        token,
        { title, body },
        stringData,
      );

      this.logger.log('Notification sent successfully');
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      if (error?.errorInfo?.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`Clearing stale push token: ${token}`);
        await this.userService.clearPushToken(token);
      }
      throw error;
    }
  }

  /**
   * Send a notification to multiple device tokens
   */
  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    type: NotificationTypeEnum = NotificationTypeEnum.General,
    data?: Record<string, any>,
  ) {
    this.logger.log(`Sending notification to ${tokens.length} tokens`);

    const results = await Promise.allSettled(
      tokens.map((token) => this.sendToToken(token, title, body, type, data)),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Notification batch complete: ${successCount} success, ${failureCount} failed`,
    );

    return {
      success: successCount,
      failed: failureCount,
      total: tokens.length,
    };
  }

  /**
   * Send a notification to a topic (for broadcasting)
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    type: NotificationTypeEnum = NotificationTypeEnum.General,
    data?: Record<string, any>,
  ) {
    try {
      this.logger.log(`Sending notification to topic: ${topic}`);

      const stringData = data
        ? this.convertDataToStrings({ ...data, type })
        : { type };

      await this.firebaseAdminService.sendToTopic(
        topic,
        { title, body },
        stringData,
      );

      this.logger.log('Topic notification sent successfully');
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send topic notification:', error);
      throw error;
    }
  }

  /**
   * Convert data object to string values (Firebase requirement)
   */
  private convertDataToStrings(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }
}
