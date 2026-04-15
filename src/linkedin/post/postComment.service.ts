import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LinkedInAuthService } from '../auth/auth.service';
import { UserService } from '../../user';
import { AuthService } from '../../auth';
import {
  CreatePostPayload,
  CreatePostResponse,
  LinkedInUserPost,
} from '../interfaces/linkedin.interface';
import { UnipileClient } from 'unipile-node-sdk';
import { ApifyClient } from 'apify-client';

@Injectable()
export class LinkedinPostService {
  private readonly logger = new Logger(LinkedinPostService.name);
  private readonly BASE_URL = 'https://api.linkedin.com/v2';

  constructor(
    private readonly linkedInAuthService: LinkedInAuthService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) { }

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

  private extractActivityId(urn: string): string {
    // Full URL: https://www.linkedin.com/posts/...-activity-7450228167287566336-bJBA?...
    const match = urn.match(/activity-(\d+)/);
    if (match) return match[1];
    // Already a bare numeric ID or URN
    const numericMatch = urn.match(/(\d{15,})/);
    if (numericMatch) return numericMatch[1];
    throw new Error(`Could not extract LinkedIn activity id from: ${urn}`);
  }

  async getPost(urn: string, userId: string) {
    const activityId = this.extractActivityId(urn);
    if (!activityId) {
      throw new Error(
        `Could not extract LinkedIn activity id from URL: ${urn}`,
      );
    }

    this.logger.debug(`Preparing LinkedIn comment on activity ${activityId}`);
    const unipileAccessToken = await this.getUnofficialTokenOrThrow(userId);
    const unipileBaseUrl =
      this.configService.get<string>('UNIPILE_API_URL') ??
      'https://api32.unipile.com:16266';
    const unipileClient = new UnipileClient(unipileBaseUrl, unipileAccessToken);
    const linkedinAccId = (await unipileClient.account.getAll()).items.find(
      (acc) => acc.type === 'LINKEDIN',
    )?.id;

    if (!linkedinAccId) {
      throw new Error('No LinkedIn account found in Unipile');
    }
    console.log('frijfmr');

    try {
      const res = await unipileClient.users.getPost({
        account_id: linkedinAccId,
        post_id: activityId,
      });
      console.log('deedde', res);
      return res;
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async commentOnPost(urn: string, commentText: string, userId: string) {
    const post = await this.getPost(urn, userId);
    const unipileAccessToken = await this.getUnofficialTokenOrThrow(userId);
    const unipileBaseUrl =
      this.configService.get<string>('UNIPILE_API_URL') ??
      'https://api32.unipile.com:16266';
    const unipileClient = new UnipileClient(unipileBaseUrl, unipileAccessToken);
    const linkedinAccId = (await unipileClient.account.getAll()).items.find(
      (acc) => acc.type === 'LINKEDIN',
    )?.id;

    if (!linkedinAccId) {
      throw new Error('No LinkedIn account found in Unipile');
    }

    if (!post.permissions.can_post_comments) {
      throw new Error(`Comments are not allowed on post ${post.id}.`);
    }

    return unipileClient.users.sendPostComment({
      account_id: linkedinAccId,
      post_id: post.id,
      text: commentText,
    });
  }

  /*
  paste just the username e.g. radoslav not the full url
  */
  public async getUserOfficialLinkedPosts(username: string, limit = 3): Promise<LinkedInUserPost[]> {
    const apifyClient = new ApifyClient({
      token: this.getRequiredConfig('APIFY_API_TOKEN'),
    });

    const input = { username, limit };
    const run = await apifyClient.actor('LQQIXN9Othf8f7R5n').call(input);
    const { items } = await apifyClient
      .dataset<LinkedInUserPost>(run.defaultDatasetId)
      .listItems();

    return items;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} is not configured`);
    }
    return value;
  }

  private async getUnofficialTokenOrThrow(userId: string): Promise<string> {
    const unofficialToken = await this.userService.getUnofficialToken(userId);
    if (!unofficialToken) {
      throw new BadRequestException(
        'User has not connected their LinkedIn account (no unofficial token)',
      );
    }
    return unofficialToken;
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

      console.log(oficialToken)
      const personUrn =
        await this.linkedInAuthService.fetchPersonUrn(oficialToken);

      const http = this.createHttpClient(oficialToken);

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
    } catch (error: unknown) {
      const errorDetails = axios.isAxiosError<unknown>(error)
        ? (error.response?.data ?? error.message)
        : error instanceof Error
          ? error.message
          : error;

      this.logger.error('Failed to create post', errorDetails);
      throw new Error('Failed to create LinkedIn post');
    }
  }
}
