import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import type { PaginateQuery, Paginated } from 'nestjs-paginate';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../user/entities';
import { PostsService } from './posts.service';
import {
  CommentOnPostDto,
  CreatePostDto,
  EnhanceDescriptionDto,
  PostsQueryDto,
  PostResponseDto,
} from './dtos';
import { Post as PostEntity } from './entities';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('AccessToken')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('enhance')
  @ApiOperation({
    summary: 'Enhance a post description with AI',
    description:
      'Runs the raw description through OpenAI and returns the improved version. Use the returned text as input to POST /posts.',
  })
  @ApiResponse({ status: 200, description: 'Enhanced description returned' })
  async enhanceDescription(
    @Body() dto: EnhanceDescriptionDto,
  ): Promise<{ description: string }> {
    const description = await this.postsService.enhanceDescription(
      dto.description,
    );
    return { description };
  }

  @Post()
  @ApiOperation({ summary: 'Create a text-only LinkedIn post' })
  @ApiResponse({
    status: 201,
    description: 'Post created and published to LinkedIn successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.createPost(user.id, dto);
  }

  @Get()
  @ApiQuery({ type: PostsQueryDto })
  @ApiOperation({
    summary: 'Get user posts with pagination and optional status filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated posts retrieved successfully',
  })
  async getUserPosts(
    @CurrentUser() user: User,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<PostEntity>> {
    return this.postsService.getUserPosts(user.id, query);
  }

  @Post('comment')
  @ApiOperation({
    summary: 'Generate and publish a comment under a LinkedIn post',
  })
  @ApiResponse({ status: 201, description: 'Comment published successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async commentOnPost(@Body() dto: CommentOnPostDto) {
    return this.postsService.commentOnPost(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post by ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved', type: PostResponseDto })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<PostResponseDto> {
    return this.postsService.getPostById(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
