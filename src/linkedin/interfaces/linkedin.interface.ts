export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export interface LinkedInUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

export interface CreatePostPayload {
  author: string;
  lifecycleState: 'PUBLISHED' | 'DRAFT';
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: { text: string };
      shareMediaCategory: 'NONE' | 'ARTICLE' | 'IMAGE';
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS';
  };
}

export interface CreatePostResponse {
  id: string;
}

export interface LinkedInUserPostUrn {
  activity_urn: string;
  share_urn: string;
  ugcPost_urn: string | null;
}

export interface LinkedInUserPostDate {
  date: string;
  relative: string;
  timestamp: number;
}

export interface LinkedInUserPostAuthor {
  first_name: string;
  last_name: string;
  headline: string;
  username: string;
  profile_url: string;
  profile_picture: string;
}

export interface LinkedInUserPostStats {
  total_reactions: number;
  like: number;
  support: number;
  love: number;
  insight: number;
  celebrate: number;
  funny: number;
  comments: number;
  reposts: number;
}

export interface LinkedInUserPostMediaImage {
  url: string;
  width: number;
  height: number;
}

export interface LinkedInUserPostMedia {
  type: string;
  url?: string;
  images?: LinkedInUserPostMediaImage[];
}

export interface LinkedInUserPost extends Record<string, unknown> {
  urn: LinkedInUserPostUrn;
  full_urn: string;
  posted_at: LinkedInUserPostDate;
  text: string;
  url: string;
  post_type: string;
  author: LinkedInUserPostAuthor;
  stats: LinkedInUserPostStats;
  media?: LinkedInUserPostMedia;
  pagination_token: string;
}
