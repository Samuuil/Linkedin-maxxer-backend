import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../posts/entities';
import { Subscription, CommentSuggestion } from '../subscription/entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Subscription, CommentSuggestion])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
