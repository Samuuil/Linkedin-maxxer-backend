# LinkedIn Maxxer Backend

A NestJS backend service for LinkedIn automation and content management.

## Features

- LinkedIn OAuth authentication with refresh token support
- Post creation and management
- Feed retrieval
- Automatic token refresh and person URN resolution

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your LinkedIn API credentials
```

3. Run database migrations:
```bash
npm run migration:run
```

4. Start the development server:
```bash
npm run start:dev
```

## API Endpoints

### Authentication

#### Get Access Token and Person URN
```http
POST /linkedin/auth/token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

Response:
```json
{
  "accessToken": "access_token_here",
  "personUrn": "urn:li:person:xxxxx"
}
```

### Posts

#### Create a LinkedIn Post
```http
POST /linkedin/post
Content-Type: application/json

{
  "refreshToken": "your_refresh_token",
  "text": "Your post content here",
  "visibility": "PUBLIC"
}
```

Response:
```json
{
  "postId": "urn:li:ugcPost:xxxxx"
}
```

### Feed

#### Get LinkedIn Feed
```http
GET /linkedin/feed?refreshToken=your_refresh_token&count=10
```

Response:
```json
{
  "elements": [...]
}
```

## Architecture

The LinkedIn module is organized as follows:

- `auth/auth.service.ts` - Handles OAuth token refresh and person URN retrieval
- `post/postComment.service.ts` - Creates LinkedIn posts using the auth service
- `getFeed/getFeed.service.ts` - Retrieves LinkedIn feed using the auth service
- `linkedin.controller.ts` - REST API endpoints
- `linkedin.module.ts` - Module configuration

All services use the `AuthService` to automatically obtain access tokens and person URNs from refresh tokens, ensuring seamless authentication.

## Environment Variables

Required environment variables:

- `LINKED_IN_APP_ACCESS_TOKEN` - Your LinkedIn app client ID
- `LINKEDIN_APP_CLIENT_SECRET` - Your LinkedIn app client secret
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name

## Development

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Tests
npm run test
```
