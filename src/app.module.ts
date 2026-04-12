import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configModuleConfig, typeOrmAsyncConfig } from './config';
import { NotificationModule } from './notification/notification.module';
import { LinkedInModule } from './linkedin/linkedin.module';
import { AuthModule } from './auth';
import { UserModule } from './user';
import { PostsModule } from './posts';
import { SubscriptionModule } from './subscription';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleConfig),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    UserModule,
    AuthModule,
    NotificationModule,
    LinkedInModule,
    PostsModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
