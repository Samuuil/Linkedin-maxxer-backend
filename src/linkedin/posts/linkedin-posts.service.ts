import { Injectable, Logger } from '@nestjs/common';

interface ImageWithAlt {
  urn: string;
  altText?: string;
}

@Injectable()
export class LinkedInPostsService {
  private readonly logger = new Logger(LinkedInPostsService.name);

  async uploadImage(
    accessToken: string,
    personUrn: string,
    imageBuffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    return `urn:li:image:PLACEHOLDER_${Date.now()}`;
  }

  async createSingleImagePost(
    accessToken: string,
    personUrn: string,
    text: string,
    imageUrn: string,
    altText?: string,
  ): Promise<string> {
    return 'urn:li:share:PLACEHOLDER_SINGLE_IMAGE_POST';
  }

  async createMultiImagePost(
    accessToken: string,
    personUrn: string,
    text: string,
    images: ImageWithAlt[],
  ): Promise<string> {
    return 'urn:li:share:PLACEHOLDER_MULTI_IMAGE_POST';
  }

  async createTextOnlyPost(
    accessToken: string,
    personUrn: string,
    text: string,
  ): Promise<string> {

    return 'urn:li:share:PLACEHOLDER_TEXT_ONLY_POST';
  }
}
