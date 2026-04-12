import { Injectable } from '@nestjs/common';

export interface LinkedInPerson {
  username: string;
  firstName: string;
  lastName: string;
}

export interface LinkedInPost {
  postId: string;
  text: string;
  createdAt: Date;
  authorUsername: string;
}

@Injectable()
export class LinkedInProfileService {
  async lookupPersonByUsername(
    _username: string,
  ): Promise<LinkedInPerson | null> {
    return null as any;
  }

  async getUserPostsByUsername(
    _username: string,
  ): Promise<LinkedInPost[]> {
    return [] as any;
  }

  async postCommentToPost(
    _postId: string,
    _commentText: string,
  ): Promise<void> {
    //
  }
}
