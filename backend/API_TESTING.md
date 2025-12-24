# API Testing Guide

This guide provides curl commands to test all implemented authentication endpoints.

## Prerequisites

1. Start Docker services:
   ```bash
   docker-compose -f ../docker/docker-compose.yml up -d
   ```

2. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```

Server should be running at: `http://localhost:4000`

---

## Health Checks

### Basic Health Check
```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "development"
  }
}
```

### Readiness Check (with dependencies)
```bash
curl http://localhost:4000/health/ready
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "checks": {
      "database": "healthy",
      "redis": "healthy"
    }
  }
}
```

---

## Authentication Endpoints

### 1. Register a New User

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!@#",
    "name": "John Doe",
    "timezone": "America/New_York",
    "interests": ["hiking", "photography", "food"]
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "avatarUrl": null,
      "timezone": "America/New_York",
      "interests": ["hiking", "photography", "food"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": "15m"
    }
  }
}
```

**Error Cases:**

Email already exists (409 Conflict):
```bash
# Trying to register with same email again
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"SecurePass123!@#","name":"John Doe"}'
```

Weak password (422 Validation Error):
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"weak","name":"Jane Doe"}'
```

---

### 2. Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!@#"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "avatarUrl": null,
      "timezone": "America/New_York",
      "interests": ["hiking", "photography", "food"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": "15m"
    }
  }
}
```

**Error Cases:**

Invalid credentials (401 Unauthorized):
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"WrongPassword"}'
```

---

### 3. Get Current User (Protected Route)

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login/register response
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "timezone": "America/New_York",
    "interests": ["hiking", "photography", "food"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Cases:**

No token (401 Unauthorized):
```bash
curl http://localhost:4000/api/v1/auth/me
```

Invalid token (401 Unauthorized):
```bash
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token"
```

---

### 4. Refresh Access Token

```bash
# Replace YOUR_REFRESH_TOKEN with the refresh token from login/register
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": "15m"
  }
}
```

---

### 5. Logout

```bash
# Replace YOUR_REFRESH_TOKEN with the refresh token
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true
}
```

---

## Rate Limiting Tests

### Authentication Rate Limit (5 requests per 15 minutes)

Try to login 6 times rapidly:
```bash
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
  echo -e "\n---"
done
```

The 6th request should return:
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many authentication attempts. Please try again later."
  }
}
```

---

## Complete Workflow Example

### 1. Register a new user
```bash
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "AliceSecure123!@#",
    "name": "Alice Smith",
    "interests": ["travel", "food", "photography"]
  }')

echo $RESPONSE | jq .

# Extract tokens (requires jq)
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.refreshToken')
```

### 2. Access protected route
```bash
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

### 3. Refresh token after expiry
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
```

### 4. Logout
```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
```

---

## Groups Endpoints

### Setup: Get Access Token First

Before testing groups, you need an access token:

```bash
# Register and save the token
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "grouptest@example.com",
    "password": "SecurePass123!@#",
    "name": "Group Tester"
  }')

# Extract access token
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.accessToken')
echo "Access Token: $ACCESS_TOKEN"
```

---

### 1. Create a Group

```bash
curl -X POST http://localhost:4000/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Europe Summer 2025",
    "description": "Planning our epic summer trip across Europe",
    "isPrivate": true
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Europe Summer 2025",
    "description": "Planning our epic summer trip across Europe",
    "imageUrl": null,
    "isPrivate": true,
    "creatorId": "clx...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "memberCount": 1,
    "userRole": "OWNER"
  }
}
```

**Save the group ID:**
```bash
GROUP_ID=$(curl -s -X POST http://localhost:4000/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name":"Test Group","description":"For testing"}' | jq -r '.data.id')

echo "Group ID: $GROUP_ID"
```

---

### 2. List Your Groups

```bash
# Basic list
curl http://localhost:4000/api/v1/groups \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# With pagination
curl "http://localhost:4000/api/v1/groups?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# With search
curl "http://localhost:4000/api/v1/groups?search=europe" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by privacy
curl "http://localhost:4000/api/v1/groups?isPrivate=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Combined filters
curl "http://localhost:4000/api/v1/groups?page=1&limit=20&search=summer&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Europe Summer 2025",
      "description": "Planning our epic summer trip",
      "imageUrl": null,
      "isPrivate": true,
      "creatorId": "clx...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "memberCount": 1,
      "userRole": "OWNER"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasMore": false
  }
}
```

---

### 3. Get Single Group

```bash
curl http://localhost:4000/api/v1/groups/$GROUP_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Europe Summer 2025",
    "description": "Planning our epic summer trip",
    "imageUrl": null,
    "isPrivate": true,
    "creatorId": "clx...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "memberCount": 1,
    "userRole": "OWNER"
  }
}
```

**Error Cases:**

Group not found (404):
```bash
curl http://localhost:4000/api/v1/groups/invalid-id \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Not a member of private group (403):
```bash
# Try to access another user's private group
curl http://localhost:4000/api/v1/groups/some-other-group-id \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### 4. Update Group (ADMIN/OWNER Only)

```bash
curl -X PATCH http://localhost:4000/api/v1/groups/$GROUP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Europe Adventure 2025",
    "description": "Updated description - backpacking across Europe!",
    "isPrivate": false
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Europe Adventure 2025",
    "description": "Updated description - backpacking across Europe!",
    "imageUrl": null,
    "isPrivate": false,
    "creatorId": "clx...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:05:00.000Z",
    "memberCount": 1,
    "userRole": "OWNER"
  }
}
```

**Partial update (only name):**
```bash
curl -X PATCH http://localhost:4000/api/v1/groups/$GROUP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name": "New Name Only"}'
```

**Error Cases:**

Not authorized (403):
```bash
# VIEWER or MEMBER trying to update
# (Need to test with a different user who is not ADMIN/OWNER)
```

---

### 5. Get Group Members

```bash
curl http://localhost:4000/api/v1/groups/$GROUP_ID/members \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "userId": "clx...",
      "role": "OWNER",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "clx...",
        "name": "Group Tester",
        "email": "grouptest@example.com",
        "avatarUrl": null
      }
    }
  ]
}
```

---

### 6. Update Member Role (ADMIN/OWNER Only)

```bash
# First, you'd need another user in the group (via invitations)
# For now, this is the structure:

curl -X PATCH http://localhost:4000/api/v1/groups/$GROUP_ID/members/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"role": "ADMIN"}'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "userId": "clx...",
    "role": "ADMIN",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "clx...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": null
    }
  }
}
```

**Business Rules:**
- OWNER can change any role except OWNER
- ADMIN can change MEMBER and VIEWER roles only
- Cannot promote anyone to OWNER
- Cannot change existing OWNER role

**Error Cases:**

Trying to promote to OWNER (403):
```bash
curl -X PATCH http://localhost:4000/api/v1/groups/$GROUP_ID/members/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"role": "OWNER"}'
```

---

### 7. Remove Member / Leave Group

```bash
# Remove another member (ADMIN/OWNER)
curl -X DELETE http://localhost:4000/api/v1/groups/$GROUP_ID/members/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Leave group (remove yourself)
curl -X DELETE http://localhost:4000/api/v1/groups/$GROUP_ID/members/$YOUR_USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Business Rules:**
- OWNER can remove anyone except themselves
- ADMIN can remove MEMBER and VIEWER
- Users can always remove themselves (leave group)
- OWNER cannot leave (must delete group or transfer ownership)

**Error Cases:**

Owner trying to leave (403):
```bash
# OWNER trying to remove themselves
curl -X DELETE http://localhost:4000/api/v1/groups/$GROUP_ID/members/$OWNER_USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Group owner cannot leave the group. Please delete the group or transfer ownership first."
  }
}
```

---

### 8. Delete Group (OWNER Only)

```bash
curl -X DELETE http://localhost:4000/api/v1/groups/$GROUP_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```

**This will cascade delete:**
- All group members
- All trips in the group
- All polls, expenses, invitations, etc.

**Error Cases:**

Not the owner (403):
```bash
# ADMIN trying to delete (only OWNER can delete)
```

---

## Complete Groups Workflow

### Full Test Flow with Two Users

```bash
# 1. Register User 1 (Owner)
USER1_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "Owner123!@#",
    "name": "Group Owner"
  }')

USER1_TOKEN=$(echo $USER1_RESPONSE | jq -r '.data.tokens.accessToken')
USER1_ID=$(echo $USER1_RESPONSE | jq -r '.data.user.id')

# 2. Create a group
GROUP_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -d '{
    "name": "Asia Backpacking 2025",
    "description": "Southeast Asia adventure",
    "isPrivate": true
  }')

GROUP_ID=$(echo $GROUP_RESPONSE | jq -r '.data.id')
echo "Created Group ID: $GROUP_ID"

# 3. List groups
curl -s http://localhost:4000/api/v1/groups \
  -H "Authorization: Bearer $USER1_TOKEN" | jq .

# 4. Get group details
curl -s http://localhost:4000/api/v1/groups/$GROUP_ID \
  -H "Authorization: Bearer $USER1_TOKEN" | jq .

# 5. Update group
curl -s -X PATCH http://localhost:4000/api/v1/groups/$GROUP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -d '{"name": "Asia Adventure 2025 - Updated"}' | jq .

# 6. Get members
curl -s http://localhost:4000/api/v1/groups/$GROUP_ID/members \
  -H "Authorization: Bearer $USER1_TOKEN" | jq .

# 7. Delete group
curl -s -X DELETE http://localhost:4000/api/v1/groups/$GROUP_ID \
  -H "Authorization: Bearer $USER1_TOKEN" | jq .
```

---

## Using Postman/Thunder Client

Import this collection (save as `api-collection.json`):

```json
{
  "info": {
    "name": "Trip Hub API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": "{{baseUrl}}/api/v1/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Test123!@#\",\n  \"name\": \"Test User\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": "{{baseUrl}}/api/v1/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Test123!@#\"\n}"
            }
          }
        },
        {
          "name": "Get Me",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{accessToken}}"}],
            "url": "{{baseUrl}}/api/v1/auth/me"
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:4000"}
  ]
}
```

---

## Troubleshooting

### Server won't start
- Check if Docker is running: `docker ps`
- Check if PostgreSQL is accessible: `docker-compose -f ../docker/docker-compose.yml logs postgres`
- Check if Redis is accessible: `docker-compose -f ../docker/docker-compose.yml logs redis`

### Database connection errors
- Verify DATABASE_URL in .env.local
- Run migrations: `npx prisma migrate dev`
- Check Prisma client is generated: `npx prisma generate`

### Redis connection errors
- Verify REDIS_URL in .env.local
- Check Redis container: `docker exec -it trip-hub-redis redis-cli ping`

### JWT errors
- Make sure JWT_SECRET and JWT_REFRESH_SECRET are at least 32 characters
- Check token expiry times in .env.local

---

## Database Inspection

### View all users:
```bash
npx prisma studio
```
Then navigate to http://localhost:5555

### Or use Prisma CLI:
```bash
# Count users
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users"

# View recent users
npx prisma db execute --stdin <<< "SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 5"
```
