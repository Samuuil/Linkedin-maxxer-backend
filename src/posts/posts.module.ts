import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities';
import { LinkedInModule } from '../linkedin/linkedin.module';
import { AuthModule } from '../auth';
import { OpenAiModule } from '../openai';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    LinkedInModule,
    AuthModule,
    OpenAiModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
