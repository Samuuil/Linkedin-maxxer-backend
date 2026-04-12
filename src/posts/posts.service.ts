import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostService as LinkedInPostService } from '../linkedin/post/postComment.service';
import { OpenAiService } from '../openai';
import { CommentOnPostDto, CreatePostDto } from './dtos';
import { Post } from './entities';
import { PostStatus } from './enums';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly linkedInPostService: LinkedInPostService,
    private readonly openAiService: OpenAiService,
  ) {}

  async createPost(userId: string, dto: CreatePostDto): Promise<Post> {
    const post = this.postsRepository.create({
      userId,
      text: dto.text,
      status: PostStatus.DRAFT,
    });
    await this.postsRepository.save(post);

    try {
      this.logger.log(`Creating text-only post for user ${userId}`);
      const linkedInPostUrn = await this.linkedInPostService.createPost(
        userId,
        dto.text,
      );

      await this.postsRepository.update(post.id, {
        linkedInPostUrn,
        status: PostStatus.PUBLISHED,
      });

      const updatedPost = await this.postsRepository.findOne({
        where: { id: post.id },
        relations: ['user'],
      });

      if (!updatedPost) {
        throw new Error('Failed to update post after publishing');
      }

      this.logger.log(`Post ${post.id} published successfully`);
      return updatedPost;
    } catch (error: any) {
      this.logger.error('Failed to create LinkedIn post', error.message);

      await this.postsRepository.update(post.id, {
        status: PostStatus.FAILED,
        error: error.message,
      });

      throw new BadRequestException(
        'Failed to create LinkedIn post: ' + error.message,
      );
    }
  }

  async enhanceDescription(description: string): Promise<string> {
    return this.openAiService.enhancePostDescription(description);
  }

  async commentOnPost(dto: CommentOnPostDto) {
    try {
      console.log("de")
      const post = await this.linkedInPostService.getPost(dto.urn);
      console.log(post)
      // const comment = await this.openAiService.generateComment(postText);
      const comment = "amazing insight"
      const result = await this.linkedInPostService.commentOnPost(
        dto.urn,
        comment,
      );

      return { comment, result };
    } catch (error: any) {
      this.logger.error('Failed to comment on LinkedIn post', error.message);
      throw new BadRequestException(
        'Failed to comment on LinkedIn post: ' + error.message,
      );
    }
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return this.postsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPostById(id: string, userId: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new BadRequestException('You can only view your own posts');
    }

    return post;
  }

  async deletePost(id: string, userId: string): Promise<void> {
    const post = await this.getPostById(id, userId);

    if (post.status === PostStatus.PUBLISHED) {
      this.logger.warn(
        `Deleting post ${id} from database, but it remains on LinkedIn`,
      );
    }

    await this.postsRepository.delete(id);
  }
}
