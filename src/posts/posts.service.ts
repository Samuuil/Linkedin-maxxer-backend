import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user';
import { AuthService as LinkedInAuthService } from '../linkedin/auth/auth.service';
import { LinkedInPostsService } from '../linkedin/posts/linkedin-posts.service';
import { CreatePostDto } from './dtos';
import { Post } from './entities';
import { PostStatus } from './enums';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  // Allowed image formats
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
  ];

  // Max image size: 10MB
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024;

  // Max number of images per post
  private readonly MAX_IMAGES = 9;

  // Min number of images for multi-image post
  private readonly MIN_MULTI_IMAGES = 2;

  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly userService: UserService,
    private readonly linkedInAuthService: LinkedInAuthService,
    private readonly linkedInPostsService: LinkedInPostsService,
  ) {}

  async createPost(
    userId: string,
    dto: CreatePostDto,
    images?: Express.Multer.File[],
  ): Promise<Post> {
    // Validate images if provided
    if (images && images.length > 0) {
      this.validateImages(images);
    }

    // Get user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.linkedinRefreshToken) {
      throw new BadRequestException(
        'User has not connected their LinkedIn account',
      );
    }

    // Create post record in database
    const post = this.postsRepository.create({
      userId,
      text: dto.text,
      altTexts: dto.altTexts || [],
      status: PostStatus.DRAFT,
    });
    await this.postsRepository.save(post);

    try {
      // Get LinkedIn access token and person URN
      const { accessToken, personUrn } =
        await this.linkedInAuthService.getAccessTokenAndUrn(
          user.linkedinRefreshToken,
        );

      let linkedInPostUrn: string;

      if (!images || images.length === 0) {
        // Text-only post
        this.logger.log(`Creating text-only post for user ${userId}`);
        linkedInPostUrn = await this.linkedInPostsService.createTextOnlyPost(
          accessToken,
          personUrn,
          dto.text,
        );
      } else if (images.length === 1) {
        // Single image post
        this.logger.log(`Creating single-image post for user ${userId}`);
        const imageUrn = await this.linkedInPostsService.uploadImage(
          accessToken,
          personUrn,
          images[0].buffer,
          images[0].mimetype,
        );

        linkedInPostUrn =
          await this.linkedInPostsService.createSingleImagePost(
            accessToken,
            personUrn,
            dto.text,
            imageUrn,
            dto.altTexts?.[0],
          );

        // Update post with image URNs
        await this.postsRepository.update(post.id, {
          imageUrns: [imageUrn],
          altTexts: dto.altTexts?.slice(0, 1) || [],
        });
      } else {
        // Multi-image post (2-9 images)
        this.logger.log(
          `Creating multi-image post with ${images.length} images for user ${userId}`,
        );

        // Upload all images in parallel
        const imageUrns = await Promise.all(
          images.map((image) =>
            this.linkedInPostsService.uploadImage(
              accessToken,
              personUrn,
              image.buffer,
              image.mimetype,
            ),
          ),
        );

        // Prepare images with alt texts
        const imagesWithAlt = imageUrns.map((urn, index) => ({
          id: urn,
          altText: dto.altTexts?.[index],
        }));

        linkedInPostUrn =
          await this.linkedInPostsService.createMultiImagePost(
            accessToken,
            personUrn,
            dto.text,
            imagesWithAlt,
          );

        // Update post with image URNs
        await this.postsRepository.update(post.id, {
          imageUrns,
          altTexts: dto.altTexts?.slice(0, images.length) || [],
        });
      }

      // Update post with LinkedIn URN and status
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

      // Update post with error
      await this.postsRepository.update(post.id, {
        status: PostStatus.FAILED,
        error: error.message,
      });

      throw new BadRequestException(
        'Failed to create LinkedIn post: ' + error.message,
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

  /**
   * Validate uploaded image files
   */
  private validateImages(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }

    // Check number of images
    if (files.length > this.MAX_IMAGES) {
      throw new BadRequestException(
        `Maximum ${this.MAX_IMAGES} images allowed per post`,
      );
    }

    // Validate each image
    files.forEach((file, index) => {
      // Check file type
      if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Image ${index + 1}: Invalid format. Allowed formats: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
        );
      }

      // Check file size
      if (file.size > this.MAX_IMAGE_SIZE) {
        throw new BadRequestException(
          `Image ${index + 1}: Size exceeds maximum allowed size of ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        );
      }

      this.logger.log(
        `Image ${index + 1} validated: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
      );
    });
  }
}
