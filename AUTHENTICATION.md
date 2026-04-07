# Authentication Guide

This document explains how authentication works in the LinkedIn Maxxer backend and how to test it.

## Overview

The application uses **LinkedIn OAuth 2.0** for authentication. Users log in with their LinkedIn accounts, and the backend:
- Exchanges the authorization code for LinkedIn access and refresh tokens
- Stores the refresh token to make LinkedIn API calls on behalf of the user
- Issues a JWT token for API authentication

**No passwords are stored** - users authenticate directly through LinkedIn.

## Authentication Flow

```
┌─────────┐                                  ┌──────────────┐
│ Client  │                                  │   Backend    │
└────┬────┘                                  └──────┬───────┘
     │                                              │
     │  1. GET /auth/linkedin/url                   │
     │─────────────────────────────────────────────>│
     │                                              │
     │  2. Returns LinkedIn OAuth URL               │
     │<─────────────────────────────────────────────│
     │                                              │
     │  3. User visits URL & logs into LinkedIn     │
     │─────────────────────────────────────────────>│
     │                                              │
     │  4. LinkedIn redirects with code             │
     │<─────────────────────────────────────────────│
     │                                              │
     │  5. POST /auth/linkedin/callback {code}      │
     │─────────────────────────────────────────────>│
     │                                              │
     │     Backend:                                 │
     │     - Exchanges code for LinkedIn tokens     │
     │     - Fetches user info from LinkedIn        │
     │     - Creates/updates user in database       │
     │     - Generates JWT token                    │
     │                                              │
     │  6. Returns JWT access token                 │
     │<─────────────────────────────────────────────│
     │                                              │
     │  7. Use JWT in Authorization header          │
     │     for all subsequent API calls             │
     │─────────────────────────────────────────────>│
```

## Step-by-Step: How to Log In

### 1. Get LinkedIn Authorization URL

**Request:**
```bash
GET http://localhost:3000/auth/linkedin/url
```

**Response:**
```json
{
  "authorizationUrl": "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=https%3A%2F%2Fwww.linkedin.com%2Fdevelopers%2Ftools%2Foauth%2Fredirect&scope=openid+profile+email+w_member_social"
}
```

### 2. User Visits LinkedIn OAuth URL

The user opens the `authorizationUrl` in their browser. They will:
1. See LinkedIn's login page (if not already logged in)
2. Log in with their LinkedIn credentials
3. Grant permissions to the app (openid, profile, email, w_member_social)
4. Get redirected to the redirect URI with a `code` parameter

**Example redirect:**
```
https://www.linkedin.com/developers/tools/oauth/redirect?code=AQT8xKz...&state=optional_state
```

### 3. Extract the Authorization Code

From the redirect URL, extract the `code` parameter:
```
code=AQT8xKz...
```

### 4. Exchange Code for JWT Token

**Request:**
```bash
POST http://localhost:3000/auth/linkedin/callback
Content-Type: application/json

{
  "code": "AQT8xKz..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "linkedinUsername": "John Doe"
}
```

### 5. Use JWT Token for API Calls

Include the JWT token in the `Authorization` header for all protected endpoints:

```bash
GET http://localhost:3000/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Testing with Postman/Thunder Client

### Collection Setup

1. **Get Authorization URL**
   - Method: `GET`
   - URL: `http://localhost:3000/auth/linkedin/url`
   - Save the `authorizationUrl` from response

2. **Visit LinkedIn (Manual Step)**
   - Open the `authorizationUrl` in your browser
   - Log in to LinkedIn
   - Copy the `code` from the redirect URL

3. **Exchange Code for Token**
   - Method: `POST`
   - URL: `http://localhost:3000/auth/linkedin/callback`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "code": "PASTE_CODE_HERE"
     }
     ```
   - Save the `accessToken` from response

4. **Test Protected Endpoint**
   - Method: `GET`
   - URL: `http://localhost:3000/auth/profile`
   - Headers: `Authorization: Bearer YOUR_ACCESS_TOKEN`

## Testing with cURL

### 1. Get Authorization URL
```bash
curl -X GET http://localhost:3000/auth/linkedin/url
```

### 2. Visit the URL in Browser
Copy the `authorizationUrl` and open it in your browser. After logging in, copy the `code` from the redirect URL.

### 3. Exchange Code for Token
```bash
curl -X POST http://localhost:3000/auth/linkedin/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "YOUR_CODE_HERE"
  }'
```

### 4. Test Protected Endpoint
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Endpoints

### Public Endpoints

#### `GET /auth/linkedin/url`
Get the LinkedIn OAuth authorization URL.

**Query Parameters:**
- `state` (optional): CSRF protection token

**Response:**
```json
{
  "authorizationUrl": "https://www.linkedin.com/oauth/v2/authorization?..."
}
```

#### `POST /auth/linkedin/callback`
Exchange LinkedIn authorization code for JWT token.

**Request Body:**
```json
{
  "code": "AQT8xKz...",
  "state": "optional_state"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "linkedinUsername": "John Doe"
}
```

### Protected Endpoints (Require JWT)

#### `GET /auth/profile`
Get current user profile.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "linkedinUsername": "John Doe",
  "linkedinSub": "abc123",
  "pushToken": "fcm_token_here",
  "createdAt": "2026-04-07T10:00:00.000Z",
  "updatedAt": "2026-04-07T10:00:00.000Z"
}
```

#### `POST /auth/push-token`
Update FCM push notification token for Android.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "pushToken": "fcm_device_token_here"
}
```

**Response:**
```
204 No Content
```

## Environment Variables

Ensure these are set in your `.env` file:

```env
# LinkedIn API Configuration
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=https://www.linkedin.com/developers/tools/oauth/redirect

# JWT Configuration
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRATION=7d
```

## How to Get LinkedIn API Credentials

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app or select an existing one
3. Go to the "Auth" tab
4. Copy your **Client ID** and **Client Secret**
5. Add redirect URIs:
   - For development: `https://www.linkedin.com/developers/tools/oauth/redirect`
   - For production: Your app's callback URL
6. Request access to the following scopes:
   - `openid` - Required for user identification
   - `profile` - Access to user's profile
   - `email` - Access to user's email
   - `w_member_social` - Post on behalf of user

## JWT Token Details

The JWT token contains:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

- **sub**: User ID (UUID)
- **email**: User's email address
- **iat**: Issued at timestamp
- **exp**: Expiration timestamp (default: 7 days)

## Security Notes

1. **No Refresh Tokens for Users**: The app stores LinkedIn's refresh token to make API calls on behalf of users, but does not implement JWT refresh tokens. Users must re-authenticate when their JWT expires.

2. **HTTPS Required**: In production, always use HTTPS for all API calls.

3. **JWT Secret**: Use a strong, random secret in production. Never commit it to version control.

4. **Token Expiration**: JWT tokens expire after 7 days by default. Adjust `JWT_EXPIRATION` in `.env` as needed.

5. **CSRF Protection**: Use the `state` parameter in OAuth flow to prevent CSRF attacks.

## Troubleshooting

### "Email not provided by LinkedIn"
- Ensure the `email` scope is granted in your LinkedIn app settings
- User must grant email permission during OAuth flow

### "Failed to authenticate with LinkedIn"
- Check that `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are correct
- Verify the authorization code hasn't expired (codes expire quickly)
- Ensure redirect URI matches exactly what's configured in LinkedIn app

### "User not found" on protected endpoints
- JWT token may be expired or invalid
- User may have been deleted from database
- Check that `JWT_SECRET` matches what was used to sign the token

### Authorization code expired
- LinkedIn authorization codes expire after a short time (usually 10 minutes)
- You must exchange the code immediately after receiving it
- If expired, start the OAuth flow again from step 1

## Database Schema

The `users` table stores:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  linkedin_username VARCHAR,
  linkedin_refresh_token VARCHAR,
  linkedin_sub VARCHAR UNIQUE,
  push_token VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- **linkedin_sub**: LinkedIn's unique user identifier (from `userinfo.sub`)
- **linkedin_refresh_token**: Stored to make LinkedIn API calls on behalf of user
- **push_token**: FCM token for Android push notifications
