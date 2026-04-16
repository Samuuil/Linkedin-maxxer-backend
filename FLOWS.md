# Authentication, Post & Comment Flows

## Table of Contents
1. [Platform Authentication](#1-platform-authentication)
2. [LinkedIn Account Setup (required before posting or commenting)](#2-linkedin-account-setup)
3. [Making a Post](#3-making-a-post)
4. [Commenting on a Post](#4-commenting-on-a-post)
5. [Key Differences Between the Two Flows](#5-key-differences)
6. [Code Issues That Need Fixing](#6-code-issues-that-need-fixing)

---

## 1. Platform Authentication

This is how a user gets a JWT to call any protected endpoint.

### Register
```
POST /api/auth/register
Body: { email, password, name }
Response: { access_token, refresh_token }
```

### Login
```
POST /api/auth/login
Body: { email, password }
Response: { access_token, refresh_token }
```

### Using the tokens
- Attach the `access_token` to every subsequent request as a header:
  ```
  Authorization: Bearer <access_token>
  ```
- The access token expires per `JWT_ACCESS_EXPIRES_IN` (default `1d`).
- When it expires, call refresh:

```
GET /api/auth/refresh
Authorization: Bearer <refresh_token>
Response: { access_token, refresh_token }
```

### How JWT validation works
Every `JwtAuthGuard`-protected endpoint runs through `JwtStrategy` (`src/auth/strategies/jwt.strategy.ts`):
1. Extracts the Bearer token from the `Authorization` header.
2. Verifies the signature against `JWT_ACCESS_SECRET`.
3. Decodes `{ id, tokenVersion }` from the payload.
4. Calls `userService.findByIdAndTokenVersion(id, tokenVersion)` — if the user doesn't exist or the token version doesn't match (e.g. after logout), the request is rejected with 401.

### Logout
```
POST /api/auth/logout
Authorization: Bearer <access_token>
```
Increments the user's `tokenVersion` in the database — this immediately invalidates all existing access and refresh tokens.

---

## 2. LinkedIn Account Setup

Before a user can post or comment, they must connect their LinkedIn credentials to their platform account. These are stored on the `User` entity and are separate from the platform JWT.

### 2a. For posting — Official LinkedIn API token
The post flow uses the **official LinkedIn API** (`/v2/ugcPosts`). This requires a LinkedIn OAuth access token stored against the user.

```
POST /api/user/linkedin/official-token
Authorization: Bearer <access_token>
Body: { oficialToken: "<linkedin_oauth_access_token>" }
```

Stored in the `oficialToken` column on the User entity (plaintext). Retrieved via `userService.getOficialToken(userId)` in `src/linkedin/post/postComment.service.ts:131`.

### 2b. For commenting — Unipile
The comment flow uses **Unipile** (a third-party LinkedIn automation API). Unipile is configured globally via the `UNIPILE_ACCESS_TOKEN` environment variable — it is **not per-user**. There is no per-user setup step required for commenting beyond having a valid platform JWT.

> See [Code Issues](#6-code-issues-that-need-fixing) — this is a significant architectural concern.

---

## 3. Making a Post

### Prerequisite
User must have set their official LinkedIn token (see [2a](#2a-for-posting--official-linkedin-api-token)).

### Endpoint
```
POST /api/posts
Authorization: Bearer <access_token>
Body: { text: "Your post content (max 3000 chars)" }
```

### Full flow
```
Client
  │
  ▼
PostsController.createPost()          [src/posts/posts.controller.ts:59]
  │  @CurrentUser() extracts user from JWT → user.id passed to service
  ▼
PostsService.createPost(userId, dto)  [src/posts/posts.service.ts:26]
  │  1. Creates Post record in DB with status = DRAFT
  │  2. Calls LinkedInPostService.createPost(userId, text)
  ▼
PostService.createPost()              [src/linkedin/post/postComment.service.ts:125]
  │  1. userService.getOficialToken(userId) → retrieves stored LinkedIn token
  │     ↳ throws if token not set
  │  2. linkedInAuthService.fetchPersonUrn(token) → GET /v2/userinfo
  │     ↳ gets the user's LinkedIn person URN (e.g. urn:li:person:abc123)
  │  3. POST https://api.linkedin.com/v2/ugcPosts
  │     with author=personUrn, text, visibility=PUBLIC
  │  4. Returns the LinkedIn post URN from response headers (x-restli-id)
  ▼
PostsService (back)
  │  3. On success: updates Post in DB → status = PUBLISHED, stores linkedInPostUrn
  │  4. On failure: updates Post in DB → status = FAILED, stores error message
  ▼
Returns PostResponseDto to client
```

### What tokens are involved
| Token | Where it comes from | What it's used for |
|---|---|---|
| Platform JWT | `Authorization` header | Identifies the user, enforced by `JwtAuthGuard` |
| `oficialToken` | `User.oficialToken` in DB | Authenticates to LinkedIn official API |

---

## 4. Commenting on a Post

### Prerequisite
User only needs a valid platform JWT. No per-user LinkedIn token is required — commenting goes through Unipile, which has its own global LinkedIn account configured in `.env`.

### Endpoint
```
POST /api/posts/comment
Authorization: Bearer <access_token>
Body: { urn: "urn:li:activity:1234567890" }
```

The `urn` is the LinkedIn post identifier (activity ID string).

### Full flow
```
Client
  │
  ▼
PostsController.commentOnPost()       [src/posts/posts.controller.ts:84]
  │  JwtAuthGuard validates the JWT ✓
  │  ⚠ @CurrentUser() is NOT used — user identity is not passed to service
  ▼
PostsService.commentOnPost(dto)       [src/posts/posts.service.ts:75]
  │  1. Calls LinkedInPostService.getPost(dto.urn)
  │  2. Sets comment text (currently hardcoded to "amazing insight")
  │  3. Calls LinkedInPostService.commentOnPost(dto.urn, comment)
  ▼
PostService.getPost(urn)              [src/linkedin/post/postComment.service.ts:38]
  │  1. Reads UNIPILE_ACCESS_TOKEN + UNIPILE_API_URL from env
  │  2. Creates UnipileClient
  │  3. Gets the first LinkedIn account registered in Unipile
  │  4. Fetches post details by activity ID
  │  Returns post object (includes post.permissions.can_post_comments)
  ▼
PostService.commentOnPost(urn, text)  [src/linkedin/post/postComment.service.ts:74]
  │  1. Reads UNIPILE_ACCESS_TOKEN again, creates another UnipileClient
  │  2. Gets the same LinkedIn account from Unipile again
  │  3. Checks post.permissions.can_post_comments → throws if false
  │  4. unipileClient.users.sendPostComment({ account_id, post_id, text })
  ▼
Returns { comment, result } to client
```

### What tokens are involved
| Token | Where it comes from | What it's used for |
|---|---|---|
| Platform JWT | `Authorization` header | Identifies the user, enforced by `JwtAuthGuard` |
| `UNIPILE_ACCESS_TOKEN` | `.env` (global) | Authenticates to Unipile's API to post the comment |

---

## 5. Key Differences

| | Making a Post | Commenting |
|---|---|---|
| **LinkedIn integration** | Official LinkedIn API (`/v2/ugcPosts`) | Unipile SDK (`sendPostComment`) |
| **Token required** | Per-user `oficialToken` stored in DB | Global `UNIPILE_ACCESS_TOKEN` in `.env` |
| **User identity used** | Yes — `@CurrentUser()` → `user.id` | No — comment is from the Unipile account |
| **Stored in DB** | Yes — `posts` table with status tracking | No |
| **Comment text** | User-supplied | Currently hardcoded (see issues below) |
| **Setup required by user** | Must set official token first | Nothing beyond platform login |

---

## 6. Code Issues That Need Fixing

### Issue 1 — Comment is not tied to the authenticated user's LinkedIn account

**File:** `src/posts/posts.controller.ts:84`, `src/posts/posts.service.ts:75`

The `commentOnPost` endpoint requires a JWT (the user is authenticated to the platform) but does not use `@CurrentUser()`. The comment is always posted from the **single global Unipile LinkedIn account**, regardless of which user triggered it.

This means:
- All users share one commenting identity on LinkedIn.
- There is no way to scope comment history or permissions per user.

**Fix — Option A:** Pass the current user to the service and use their stored Unipile account ID (if Unipile supports per-user accounts). Update the controller:

```typescript
// src/posts/posts.controller.ts
async commentOnPost(
  @CurrentUser() user: User,   // add this
  @Body() dto: CommentOnPostDto,
) {
  return this.postsService.commentOnPost(user.id, dto);  // pass user.id
}
```

And the service:
```typescript
// src/posts/posts.service.ts
async commentOnPost(userId: string, dto: CommentOnPostDto) { ... }
```

Then in `PostService`, look up the Unipile account that belongs to that user rather than using `getAll()[0]`.

**Fix — Option B:** If the global Unipile account is intentional (one managed LinkedIn identity), document this clearly and remove the misleading implication that the comment comes from the authenticated user.

---

### Issue 2 — Comment text is hardcoded

**File:** `src/posts/posts.service.ts:81`

```typescript
const comment = "amazing insight"   // ← placeholder, never replaced
```

The call to `openAiService.generateComment()` is commented out. Either:
- Uncomment and wire up the AI-generated comment:
  ```typescript
  const post = await this.linkedInPostService.getPost(dto.urn);
  const comment = await this.openAiService.generateComment(post.description ?? dto.urn);
  ```
- Or accept the comment text from the client via `CommentOnPostDto`:
  ```typescript
  // add to CommentOnPostDto:
  @IsString()
  @IsNotEmpty()
  comment: string;
  ```

---

### Issue 3 — Unipile client is created twice per comment

**File:** `src/linkedin/post/postComment.service.ts:38–98`

`commentOnPost()` calls `getPost()` internally, and both methods independently instantiate `UnipileClient` and call `unipileClient.account.getAll()`. That's 2 HTTP round-trips to Unipile just to get the same account ID.

**Fix:** Refactor into a shared private helper:

```typescript
private async getUnipileClient(): Promise<{ client: UnipileClient; accountId: string }> {
  const token = this.getRequiredConfig('UNIPILE_ACCESS_TOKEN');
  const baseUrl = this.configService.get<string>('UNIPILE_API_URL') ?? 'https://api32.unipile.com:16266';
  const client = new UnipileClient(baseUrl, token);
  const accountId = (await client.account.getAll()).items.find(
    (acc) => acc.type === 'LINKEDIN',
  )?.id;
  if (!accountId) throw new Error('No LinkedIn account found in Unipile');
  return { client, accountId };
}
```

Then call `this.getUnipileClient()` once in `commentOnPost()` instead of re-building it in both `getPost()` and `commentOnPost()`.

---

### Issue 4 — Debug `console.log` statements left in production code

**Files:**
- `src/linkedin/post/postComment.service.ts:59,66,67,138`
- `src/posts/posts.service.ts:77,79`

These should be replaced with the existing `this.logger` calls or removed entirely.

---

### Issue 5 — `@IsUrl()` imported but unused in `CommentOnPostDto`

**File:** `src/posts/dtos/comment-on-post.dto.ts:3`

```typescript
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
// IsUrl is imported but not applied to any field
```

Since the `urn` field accepts both raw URNs (`urn:li:activity:...`) and full URLs, `@IsUrl()` would reject raw URNs anyway. Remove the unused import.

```typescript
import { IsNotEmpty, IsString } from 'class-validator';
```
