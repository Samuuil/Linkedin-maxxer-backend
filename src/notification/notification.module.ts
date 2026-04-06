import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseAdminService } from './firebase-admin.service';

@Module({
  providers: [NotificationService, FirebaseAdminService],
  exports: [NotificationService],
})
export class NotificationModule {}
