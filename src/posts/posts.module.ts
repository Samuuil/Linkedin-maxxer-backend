import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities';
import { UserModule } from '../user/user.module';
import { LinkedInModule } from '../linkedin/linkedin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    UserModule,
    LinkedInModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
