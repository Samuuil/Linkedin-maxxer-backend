# Architecture Overview

## Service Interlinking

The LinkedIn module follows a clean architecture pattern where services are properly interlinked through dependency injection.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LinkedInController                        │
│  - POST /linkedin/auth/token                                 │
│  - POST /linkedin/post                                       │
│  - GET /linkedin/feed                                        │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Uses
             │
    ┌────────┴────────┬──────────────────┐
    │                 │                  │
    ▼                 ▼                  ▼
┌─────────┐    ┌─────────────┐   ┌──────────────┐
│  Auth   │◄───│    Post     │   │   GetFeed    │
│ Service │    │   Service   │   │   Service    │
└─────────┘    └─────────────┘   └──────────────┘
                      │                  │
                      └──────────────────┘
                             │
                             │ Depends on
                             │
                      ┌──────▼──────┐
                      │    Auth     │
                      │   Service   │
                      └─────────────┘
```

## Key Components

### 1. AuthService
**Location:** `src/linkedin/auth/auth.service.ts`

**Responsibilities:**
- Refresh LinkedIn access tokens from refresh tokens
- Fetch person URN from access tokens
- Provide combined method `getAccessTokenAndUrn()` for other services

**Dependencies:**
- `ConfigService` - For LinkedIn credentials

**Key Methods:**
```typescript
getAccessTokenFromRefreshToken(refreshToken: string): Promise<string>
fetchPersonUrn(accessToken: string): Promise<string>
getAccessTokenAndUrn(refreshToken: string): Promise<{ accessToken, personUrn }>
```

### 2. PostService
**Location:** `src/linkedin/post/postComment.service.ts`

**Responsibilities:**
- Create LinkedIn posts
- Automatically handle authentication via AuthService

**Dependencies:**
- `AuthService` - Injected to get access tokens and URNs

**Key Methods:**
```typescript
postCommentToArticle(
  refreshToken: string,
  text: string,
  visibility: 'PUBLIC' | 'CONNECTIONS'
): Promise<string>
```

**Flow:**
1. Receives refresh token from controller
2. Calls `authService.getAccessTokenAndUrn(refreshToken)`
3. Uses returned access token and person URN to create post
4. Returns post ID

### 3. GetFeedService
**Location:** `src/linkedin/getFeed/getFeed.service.ts`

**Responsibilities:**
- Retrieve LinkedIn feed
- Automatically handle authentication via AuthService

**Dependencies:**
- `AuthService` - Injected to get access tokens

**Key Methods:**
```typescript
getFeed(refreshToken: string, count: number): Promise<any>
```

**Flow:**
1. Receives refresh token from controller
2. Calls `authService.getAccessTokenAndUrn(refreshToken)`
3. Uses returned access token to fetch feed
4. Returns feed data

### 4. LinkedInController
**Location:** `src/linkedin/linkedin.controller.ts`

**Responsibilities:**
- Expose REST API endpoints
- Route requests to appropriate services

**Dependencies:**
- `AuthService`
- `PostService`
- `GetFeedService`

## Dependency Injection Flow

```typescript
// In linkedin.module.ts
@Module({
  imports: [ConfigModule],
  controllers: [LinkedInController],
  providers: [
    AuthService,      // ← Registered first (no dependencies on other LinkedIn services)
    PostService,      // ← Depends on AuthService
    GetFeedService,   // ← Depends on AuthService
  ],
  exports: [AuthService, PostService, GetFeedService],
})
export class LinkedInModule {}
```

## Benefits of This Architecture

1. **Single Responsibility:** Each service has a clear, focused purpose
2. **Reusability:** AuthService is reused by both PostService and GetFeedService
3. **Testability:** Services can be easily mocked for unit testing
4. **Maintainability:** Changes to authentication logic only need to happen in AuthService
5. **Type Safety:** Full TypeScript support with proper interfaces
6. **Error Handling:** Centralized error handling in each service layer

## Example Usage Flow

When a user creates a post:

1. Client sends POST request to `/linkedin/post` with `refreshToken` and `text`
2. `LinkedInController.createPost()` receives the request
3. Controller calls `postService.postCommentToArticle(refreshToken, text)`
4. PostService calls `authService.getAccessTokenAndUrn(refreshToken)`
5. AuthService:
   - Calls LinkedIn OAuth API to refresh token
   - Calls LinkedIn userinfo API to get person URN
   - Returns both to PostService
6. PostService uses the credentials to create the post
7. PostService returns post ID to controller
8. Controller returns response to client

This ensures that authentication is handled transparently and consistently across all LinkedIn operations.
