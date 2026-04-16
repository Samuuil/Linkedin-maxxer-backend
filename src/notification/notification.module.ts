import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [NotificationService, FirebaseAdminService],
  exports: [NotificationService],
})
export class NotificationModule {}
