import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../user/entities';
import { PostsService } from './posts.service';
import { CreatePostDto, PostResponseDto } from './dtos';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('AccessToken')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 9))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Post text content (max 3000 characters)',
          example: 'Check out this amazing content!',
          maxLength: 3000,
        },
        altTexts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alt texts for images (optional, should match number of images)',
          example: ['First image description', 'Second image description'],
          maxItems: 9,
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files (optional, max 9 images, each max 10MB, formats: JPEG, PNG, GIF)',
          maxItems: 9,
        },
      },
      required: ['text'],
    },
  })
  @ApiOperation({ summary: 'Create a new LinkedIn post with up to 9 images' })
  @ApiResponse({
    status: 201,
    description: 'Post created and published to LinkedIn successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (invalid image format, size, too many images, or missing LinkedIn connection)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async createPost(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<PostResponseDto> {
    return this.postsService.createPost(user.id, dto, images);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: [PostResponseDto],
  })
  async getUserPosts(@CurrentUser() user: User): Promise<PostResponseDto[]> {
    return this.postsService.getUserPosts(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post by ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getPostById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<PostResponseDto> {
    return this.postsService.getPostById(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({
    status: 200,
    description: 'Post deleted successfully (only removes from database, not from LinkedIn)',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async deletePost(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.postsService.deletePost(id, user.id);
    return {
      message: 'Post deleted successfully from database (still exists on LinkedIn)',
    };
  }
}
