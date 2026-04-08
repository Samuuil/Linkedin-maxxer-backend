import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  LinkedInTokenResponse,
  LinkedInUserInfo,
} from '../interfaces/linkedin.interface';

@Injectable()
export class LinkedInAuthService {
  private readonly logger = new Logger(LinkedInAuthService.name);

  constructor(private configService: ConfigService) {}

  async getAccessTokenFromRefreshToken(
    refreshToken: string,
  ): Promise<string> {
    try {
      const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'LINKEDIN_CLIENT_SECRET',
      );

      if (!clientId || !clientSecret) {
        throw new Error('LinkedIn credentials not configured');
      }

      const tokenResponse = await axios.post<LinkedInTokenResponse>(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, expires_in } = tokenResponse.data;

      this.logger.log(
        `Access token obtained, expires in: ${Math.round(expires_in / 3600)} hours`,
      );

      return access_token;
    } catch (error: any) {
      this.logger.error(
        'Failed to get access token',
        error.response?.data || error.message,
      );
      throw new Error('Failed to refresh access token');
    }
  }

  async fetchPersonUrn(accessToken: string): Promise<string> {
    try {
      const response = await axios.get<LinkedInUserInfo>(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const { sub, name, given_name, family_name } = response.data;

      if (sub) {
        const personUrn = `urn:li:person:${sub}`;
        this.logger.log(
          `Person URN: ${personUrn}, Profile: ${name || `${given_name} ${family_name}`}`,
        );
        return personUrn;
      } else {
        throw new Error('Could not fetch person URN from profile');
      }
    } catch (error: any) {
      this.logger.error(
        'Could not fetch profile',
        error.response?.data || error.message,
      );
      throw new Error('Failed to fetch person URN');
    }
  }

  async getAccessTokenAndUrn(
    refreshToken: string,
  ): Promise<{ accessToken: string; personUrn: string }> {
    const accessToken = await this.getAccessTokenFromRefreshToken(refreshToken);
    const personUrn = await this.fetchPersonUrn(accessToken);
    return { accessToken, personUrn };
  }
}