import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private messaging: admin.messaging.Messaging;
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('Initializing Firebase Admin SDK...');

    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK:', error);
        return;
      }
    } else {
      this.logger.log('Firebase Admin SDK already initialized');
    }

    this.messaging = admin.messaging();
    this.logger.log('Firebase Messaging service ready');
  }

  async sendMessage(message: admin.messaging.Message) {
    try {
      this.logger.debug('Sending Firebase message:', {
        hasToken: 'token' in message,
        hasTopic: 'topic' in message,
      });
      const result = await this.messaging.send(message);
      this.logger.log('Firebase message sent successfully:', result);
      return result;
    } catch (error) {
      this.logger.error('Failed to send Firebase message:', error);
      throw error;
    }
  }

  async sendToToken(
    token: string,
    notification: {
      title: string;
      body: string;
    },
    data?: Record<string, string>,
  ) {
    const message: admin.messaging.Message = {
      token,
      notification,
      data,
      webpush: {
        headers: {
          TTL: '86400',
        },
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
        },
      },
    };
    return this.sendMessage(message);
  }

  async sendToTopic(
    topic: string,
    notification: {
      title: string;
      body: string;
    },
    data?: Record<string, string>,
  ) {
    const message: admin.messaging.Message = {
      topic,
      notification,
      data,
      webpush: {
        headers: {
          TTL: '86400',
        },
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
        },
      },
    };
    return this.sendMessage(message);
  }
}
