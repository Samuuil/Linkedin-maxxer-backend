import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { LinkedInAuthService } from '../auth/auth.service';
import { UserService } from '../../user';
import {
  CreatePostPayload,
  CreatePostResponse,
} from '../interfaces/linkedin.interface';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  private readonly BASE_URL = 'https://api.linkedin.com/v2';

  constructor(
    private authService: LinkedInAuthService,
    private userService: UserService,
  ) {}

  private createHttpClient(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: this.BASE_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
  }

  async createPost(
    userId: string,
    text: string,
    visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  ): Promise<string> {
    try {
      const oficialToken = await this.userService.getOficialToken(userId);
      if (!oficialToken) {
        throw new BadRequestException(
          'User has not connected their LinkedIn account (no official token)',
        );
      }
      const { accessToken, personUrn } =
        await this.authService.getAccessTokenAndUrn(oficialToken);

      const http = this.createHttpClient(accessToken);

      const payload: CreatePostPayload = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility,
        },
      };

      const { data, headers } = await http.post<CreatePostResponse>(
        '/ugcPosts',
        payload,
      );

      const postId: string =
        (headers['x-restli-id'] as string) || data.id || '';

      this.logger.log(`Post created successfully: ${postId}`);
      return postId;
    } catch (error: any) {
      this.logger.error(
        'Failed to create post',
        error.response?.data || error.message,
      );
      throw new Error('Failed to create LinkedIn post');
    }
  }
}