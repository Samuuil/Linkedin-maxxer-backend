import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GetFeedService {
  private readonly logger = new Logger(GetFeedService.name);
  private readonly BASE_URL = 'https://api.linkedin.com/v2';

  constructor(private authService: AuthService) {}

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

  async getFeed(refreshToken: string, count: number = 10): Promise<any> {
    try {
      const { accessToken } =
        await this.authService.getAccessTokenAndUrn(refreshToken);

      const http = this.createHttpClient(accessToken);

      const response = await http.get('/ugcPosts', {
        params: {
          q: 'authors',
          count,
        },
      });

      this.logger.log(`Fetched ${response.data?.elements?.length || 0} posts`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch feed',
        error.response?.data || error.message,
      );
      throw new Error('Failed to fetch LinkedIn feed');
    }
  }
}
