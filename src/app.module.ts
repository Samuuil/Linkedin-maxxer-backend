import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configModuleConfig, typeOrmAsyncConfig } from './config';
import { NotificationModule } from './notification/notification.module';
import { LinkedInModule } from './linkedin/linkedin.module';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleConfig),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    NotificationModule,
    LinkedInModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
