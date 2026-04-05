# SplitPro Backend — Multi-Agent Development Playbook

> **Read this entire file before writing a single line of code.**
> This document is the single source of truth for all agents working on this project.
> All agents share this file. All agents write to the shared log at the bottom.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Agent Rules — Non-Negotiable](#2-agent-rules--non-negotiable)
3. [Shared Agent Log Protocol](#3-shared-agent-log-protocol)
4. [Tech Stack & Versions](#4-tech-stack--versions)
5. [Repository Structure](#5-repository-structure)
6. [Environment Setup](#6-environment-setup)
7. [Module Build Order](#7-module-build-order)
8. [Module Specifications](#8-module-specifications)
   - [8.1 Config & Bootstrap](#81-config--bootstrap)
   - [8.2 Auth Module](#82-auth-module)
   - [8.3 User Module](#83-user-module)
   - [8.4 Friend Module](#84-friend-module)
   - [8.5 Group Module](#85-group-module)
   - [8.6 Expense Module](#86-expense-module)
   - [8.7 Settlement Module](#87-settlement-module)
   - [8.8 Notification Module](#88-notification-module)
   - [8.9 File Upload Module](#89-file-upload-module)
   - [8.10 Sync Module](#810-sync-module)
   - [8.11 Audit Log Module](#811-audit-log-module)
   - [8.12 BullMQ Workers](#812-bullmq-workers)
9. [Shared Utilities](#9-shared-utilities)
10. [Database Conventions](#10-database-conventions)
11. [API Conventions](#11-api-conventions)
12. [Testing Requirements](#12-testing-requirements)
13. [Docker & CI/CD](#13-docker--cicd)
14. [Security Checklist](#14-security-checklist)
15. [Shared Agent Log](#15-shared-agent-log)

---

## 1. Project Overview

**App:** SplitPro — Splitwise-like expense sharing backend
**Scale target:** Millions of users
**Constraints:** No real payments (tracking only). Single currency (INR, amounts in paise as integers).

### Core Domain Rules

- All monetary amounts are **integers in paise** (₹1 = 100 paise). Never use floats for money.
- Expense splits must always sum exactly to the expense total. The split engine enforces this with the Largest Remainder Method for percentage/share rounding.
- Debt records are **recomputed** from expenses on every write — they are not event-sourced.
- The simplified debt graph is **derived data** — never persist it. Compute on demand, cache in Redis with a short TTL.
- All writes to financial data (expenses, debts, settlements) must run inside **MongoDB sessions (transactions)**.
- Every state-changing request must produce an **audit log** entry and **sync event** entries within the same transaction.

---

## 2. Agent Rules — Non-Negotiable

These rules exist so multiple agents do not step on each other, duplicate work, or break existing code.

### Before starting any task

1. **Read the full [Shared Agent Log](#15-shared-agent-log)** — all entries, not just recent ones.
2. **Check what is marked `DONE`** — do not re-implement completed work.
3. **Check what is marked `IN_PROGRESS`** — coordinate or wait before touching the same files.
4. **Check `BLOCKED` entries** — you may be the agent that can unblock someone.
5. **Read the module spec** for the module you are about to build (Section 8).
6. **Read the Database Conventions** (Section 10) and **API Conventions** (Section 11) before writing any schema or route.

### While working

7. **Write your `IN_PROGRESS` log entry immediately** before you write any file. Do not write code first.
8. **Do not modify files owned by another module** without adding a log entry explaining why and what you changed.
9. **Do not change shared utilities** (`src/shared/`) without marking it in the log — other agents depend on these.
10. **Follow the exact folder structure** in Section 5. Do not invent new top-level folders.
11. **Import only from within your module or `src/shared/`** — never cross-import between sibling modules (e.g. expense module must not import directly from settlement module internals).
12. **Expose cross-module functionality via service methods only** — never import a sibling module's schema or model directly. Use the public service interface.

### When finishing a task

13. **Run the relevant tests** before marking anything `DONE`.
14. **Update your log entry** from `IN_PROGRESS` to `DONE` with a summary of files created/modified.
15. **Add any discovered blockers or follow-up tasks** as new log entries with status `TODO`.

### Forbidden actions

- ❌ Never delete or overwrite another agent's completed files without a log entry
- ❌ Never use `any` type in TypeScript — use `unknown` and narrow, or define proper types
- ❌ Never use floating point for money calculations
- ❌ Never commit secrets, API keys, or passwords — use environment variables only
- ❌ Never bypass the auth middleware on protected routes
- ❌ Never write directly to the database from a controller — always go through the service layer
- ❌ Never skip input validation with Zod on any route handler
- ❌ Never use `console.log` — use the shared Pino logger (`src/shared/utils/logger.ts`)

---

## 3. Shared Agent Log Protocol

The log is in **Section 15** of this file. It is append-only. Never delete or modify existing entries.

### Log entry format

```
### [TIMESTAMP] [AGENT_ID] [STATUS] — [MODULE/TASK]

**Status:** IN_PROGRESS | DONE | BLOCKED | TODO
**Agent:** <identifier for this agent session, e.g. "Agent-A", "Claude-Session-3">
**Files touched:**
- src/path/to/file.ts (created | modified | deleted)

**Summary:**
One paragraph describing what was done or what is planned.

**Dependencies needed from other agents:**
- List any files/exports you are waiting on from another module

**Blockers:**
- List anything preventing completion

**Follow-up TODOs:**
- Any tasks discovered that are out of scope for this session
---
```

### Status definitions

| Status | Meaning |
|---|---|
| `TODO` | Identified but not yet started by any agent |
| `IN_PROGRESS` | Currently being worked on — do not touch these files |
| `DONE` | Complete, tested, and safe to depend on |
| `BLOCKED` | Waiting on another agent or external dependency |
| `REVIEW_NEEDED` | Done but needs another agent to sanity-check |

---

## 4. Tech Stack & Versions

Pin these versions in `package.json`. Do not upgrade without a log entry and team agreement.

```json
{
  "node": "20.x",
  "typescript": "5.4.x",
  "express": "4.19.x",
  "mongoose": "8.x",
  "ioredis": "5.x",
  "bullmq": "5.x",
  "zod": "3.x",
  "pino": "9.x",
  "pino-http": "10.x",
  "jsonwebtoken": "9.x",
  "jwks-rsa": "3.x",
  "axios": "1.x",
  "@aws-sdk/client-s3": "3.x",
  "@aws-sdk/s3-request-presigner": "3.x",
  "firebase-admin": "12.x",
  "uuid": "10.x",
  "helmet": "7.x",
  "cors": "2.x",
  "express-rate-limit": "7.x",
  "rate-limit-redis": "4.x",
  "jest": "29.x",
  "@types/jest": "29.x",
  "ts-jest": "29.x",
  "supertest": "7.x"
}
```

**TypeScript config (`tsconfig.json`):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 5. Repository Structure

Agents must place files in exactly these locations. Do not deviate.

```
splitpro-api/
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod-validated env schema — fail fast on startup
│   │   ├── database.ts         # Mongoose connection with retry
│   │   ├── redis.ts            # ioredis connection singleton
│   │   ├── s3.ts               # AWS S3 client singleton
│   │   └── fcm.ts              # Firebase Admin SDK singleton
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── user.routes.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.schema.ts
│   │   │   ├── user.model.ts
│   │   │   └── user.types.ts
│   │   │
│   │   ├── friends/
│   │   │   ├── friendship.routes.ts
│   │   │   ├── friendship.controller.ts
│   │   │   ├── friendship.service.ts
│   │   │   ├── friendship.schema.ts
│   │   │   ├── friendship.model.ts
│   │   │   └── friendship.types.ts
│   │   │
│   │   ├── groups/
│   │   │   ├── group.routes.ts
│   │   │   ├── group.controller.ts
│   │   │   ├── group.service.ts
│   │   │   ├── group.schema.ts
│   │   │   ├── group.model.ts
│   │   │   └── group.types.ts
│   │   │
│   │   ├── expenses/
│   │   │   ├── expense.routes.ts
│   │   │   ├── expense.controller.ts
│   │   │   ├── expense.service.ts
│   │   │   ├── expense.schema.ts
│   │   │   ├── expense.model.ts
│   │   │   ├── expense.types.ts
│   │   │   ├── split-engine.ts       # Pure functions only — no DB calls
│   │   │   └── recurring.service.ts
│   │   │
│   │   ├── settlements/
│   │   │   ├── settlement.routes.ts
│   │   │   ├── settlement.controller.ts
│   │   │   ├── settlement.service.ts
│   │   │   ├── settlement.schema.ts
│   │   │   ├── settlement.model.ts
│   │   │   ├── settlement.types.ts
│   │   │   └── debt-simplifier.ts    # Pure functions only — no DB calls
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.routes.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.schema.ts
│   │   │   ├── notification.model.ts
│   │   │   └── notification.types.ts
│   │   │
│   │   ├── uploads/
│   │   │   ├── upload.routes.ts
│   │   │   ├── upload.controller.ts
│   │   │   └── upload.service.ts
│   │   │
│   │   ├── sync/
│   │   │   ├── sync.routes.ts
│   │   │   ├── sync.controller.ts
│   │   │   ├── sync.service.ts
│   │   │   ├── sync.schema.ts
│   │   │   └── sync.model.ts
│   │   │
│   │   └── audit/
│   │       ├── audit.service.ts      # Internal only — no routes
│   │       ├── audit.schema.ts
│   │       └── audit.model.ts
│   │
│   ├── workers/
│   │   ├── index.ts                  # Worker process entry point
│   │   ├── fcm.worker.ts
│   │   ├── recurring.worker.ts
│   │   ├── debt-recompute.worker.ts
│   │   └── audit.worker.ts
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── error-handler.ts      # Global Express error handler
│   │   │   ├── rate-limiter.ts       # Redis-backed rate limiting configs
│   │   │   ├── request-id.ts         # Attach UUID to every request
│   │   │   └── validate.ts           # Zod validation middleware factory
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   ├── ValidationError.ts
│   │   │   ├── NotFoundError.ts
│   │   │   ├── ForbiddenError.ts
│   │   │   └── ConflictError.ts
│   │   ├── utils/
│   │   │   ├── currency.ts           # Paise formatting, validation
│   │   │   ├── pagination.ts         # Cursor encode/decode
│   │   │   ├── logger.ts             # Pino structured logger
│   │   │   └── cache.ts              # Redis cache-aside helpers
│   │   └── events/
│   │       └── event-bus.ts          # Internal Node.js EventEmitter bus
│   │
│   ├── app.ts                        # Express app factory (no listen() here)
│   └── server.ts                     # HTTP server + graceful shutdown
│
├── tests/
│   ├── unit/
│   │   ├── split-engine.test.ts
│   │   └── debt-simplifier.test.ts
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── expenses.test.ts
│   │   └── settlements.test.ts
│   └── helpers/
│       ├── db.ts                     # In-memory MongoDB setup for tests
│       └── fixtures.ts               # Test data factories
│
├── scripts/
│   ├── seed.ts                       # Dev data seeding
│   └── create-indexes.ts             # Idempotent index creation script
│
├── .env
├── .env.example
├── .eslintrc.json
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.ts
├── package.json
└── tsconfig.json
```

---

## 6. Environment Setup

### `.env.example` — copy to `.env` and fill in values

```env
# App
NODE_ENV=development
PORT=3000
API_VERSION=v1

# MongoDB
MONGODB_URI=mongodb://localhost:27017/splitpro
MONGODB_DB_NAME=splitpro

# Redis
REDIS_URL=redis://localhost:6379

# JWT — generate RS256 key pair: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem
JWT_PRIVATE_KEY_BASE64=<base64 encoded PEM>
JWT_PUBLIC_KEY_BASE64=<base64 encoded PEM>
JWT_ACCESS_TOKEN_TTL_SECONDS=900
JWT_REFRESH_TOKEN_TTL_SECONDS=2592000
JWT_ISSUER=splitpro-api

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY_BASE64=

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=splitpro-prod
CLOUDFRONT_URL=https://cdn.splitpro.io

# Firebase
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64 encoded JSON>

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_GLOBAL=500
RATE_LIMIT_MAX_AUTH=10

# File uploads
MAX_FILE_SIZE_BYTES=10485760
UPLOAD_PRESIGN_TTL_SECONDS=300
```

### `src/config/env.ts` — implement this first

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_VERSION: z.string().default('v1'),
  MONGODB_URI: z.string().url(),
  MONGODB_DB_NAME: z.string(),
  REDIS_URL: z.string(),
  JWT_PRIVATE_KEY_BASE64: z.string(),
  JWT_PUBLIC_KEY_BASE64: z.string(),
  JWT_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().default(2592000),
  JWT_ISSUER: z.string().default('splitpro-api'),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  CLOUDFRONT_URL: z.string().url(),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_GLOBAL: z.coerce.number().default(500),
  RATE_LIMIT_MAX_AUTH: z.coerce.number().default(10),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(10485760),
  UPLOAD_PRESIGN_TTL_SECONDS: z.coerce.number().default(300),
});

// This will throw at startup if any required env var is missing — intended behaviour
export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

---

## 7. Module Build Order

Agents must build modules in this order to respect dependencies. An agent assigned to module N must not start until all modules < N are `DONE` in the log.

```
Phase 1 — Foundation (no module dependencies)
  1.1  src/shared/  — errors, utils, middleware, event-bus
  1.2  src/config/  — env, database, redis, s3, fcm
  1.3  src/app.ts + src/server.ts

Phase 2 — Identity
  2.1  users module  (depends on: shared, config)
  2.2  auth module   (depends on: users, shared, config)

Phase 3 — Social graph
  3.1  friends module  (depends on: users, auth)
  3.2  groups module   (depends on: users, auth)

Phase 4 — Core domain
  4.1  audit module          (depends on: shared)
  4.2  sync module           (depends on: shared, users)
  4.3  expenses module       (depends on: groups, users, audit, sync)
  4.4  settlements module    (depends on: expenses, groups, audit, sync)

Phase 5 — Supporting services
  5.1  notifications module  (depends on: users, groups, expenses, settlements)
  5.2  uploads module        (depends on: users, config/s3)
  5.3  workers               (depends on: notifications, expenses, audit)
```

---

## 8. Module Specifications

### 8.1 Config & Bootstrap

**Agent responsible for this section builds:**

`src/config/database.ts`
```typescript
// Mongoose connection with exponential backoff retry
// - Set bufferCommands: false (fail fast if disconnected)
// - Set serverSelectionTimeoutMS: 5000
// - Listen to connection events and log with Pino
// - Export connectDatabase() async function
// - Export mongoose instance for session creation
```

`src/config/redis.ts`
```typescript
// ioredis singleton
// - lazyConnect: true
// - reconnectOnError: always
// - maxRetriesPerRequest: 3
// - Export redis client as named export
// - Export a separate redisForBullMQ client (BullMQ requires its own connection)
```

`src/app.ts`
```typescript
// Express app factory — createApp() returns Express app
// Middleware order (must be exactly this order):
// 1. helmet()
// 2. cors() — configure allowed origins from env
// 3. express.json({ limit: '1mb' })
// 4. requestId middleware
// 5. pino-http logger
// 6. Global rate limiter
// 7. Route mounting:
//    app.use('/api/v1/auth',          authRouter)
//    app.use('/api/v1/users',         userRouter)
//    app.use('/api/v1/friends',       friendRouter)
//    app.use('/api/v1/groups',        groupRouter)
//    app.use('/api/v1/expenses',      expenseRouter)
//    app.use('/api/v1/settlements',   settlementRouter)
//    app.use('/api/v1/notifications', notificationRouter)
//    app.use('/api/v1/uploads',       uploadRouter)
//    app.use('/api/v1/sync',          syncRouter)
// 8. 404 handler
// 9. Global error handler (must be last, 4-argument signature)
// Health check at GET /health — returns 200 with { status: 'ok', uptime }
```

`src/server.ts`
```typescript
// Startup sequence:
// 1. Import and validate env (import from config/env.ts — triggers validation)
// 2. Connect MongoDB
// 3. Connect Redis
// 4. Create Express app
// 5. server.listen()
// Graceful shutdown on SIGTERM / SIGINT:
// - Stop accepting new connections
// - Close Redis connection
// - Close Mongoose connection
// - Exit with code 0
```

---

### 8.2 Auth Module

**Responsibilities:** OAuth2 code exchange (Google + Apple), JWT issuance, token refresh with rotation, logout/revocation, device session tracking.

#### Schemas (no Mongoose model — tokens live in Redis)

```typescript
// Refresh token stored in Redis
// Key pattern: refreshToken:{tokenValue}
// Value (JSON):
interface RefreshTokenPayload {
  userId: string;
  deviceId: string;
  issuedAt: number;          // Unix timestamp
}
// TTL: env.JWT_REFRESH_TOKEN_TTL_SECONDS
```

#### JWT Access Token

```typescript
interface JwtPayload {
  sub: string;               // userId
  deviceId: string;
  iat: number;
  exp: number;
  iss: string;               // env.JWT_ISSUER
  jti: string;               // uuid — for future blacklisting
}
// Sign with RS256 using private key from env.JWT_PRIVATE_KEY_BASE64
// Verify with public key from env.JWT_PUBLIC_KEY_BASE64
```

#### Routes

```
POST /api/v1/auth/oauth/google      — Exchange Google auth code → tokens
POST /api/v1/auth/oauth/apple       — Exchange Apple auth code → tokens
POST /api/v1/auth/refresh           — Rotate refresh token → new access + refresh
POST /api/v1/auth/logout            — Revoke current device's refresh token
GET  /api/v1/auth/me                — Return current user (requires auth middleware)
```

#### Service logic

**`exchangeGoogleCode(code: string, deviceId: string)`**
1. POST to `https://oauth2.googleapis.com/token` with code, clientId, clientSecret, redirectUri
2. GET `https://www.googleapis.com/oauth2/v2/userinfo` with the access token
3. Upsert user: `User.findOneAndUpdate({ 'oauthProviders.provider': 'google', 'oauthProviders.providerId': profile.id }, { ... }, { upsert: true, new: true, session })`
4. Call `issueTokenPair(userId, deviceId)` and return

**`issueTokenPair(userId: string, deviceId: string)`**
1. Generate `jti = uuid()`
2. Sign JWT access token (RS256, TTL from env)
3. Generate refresh token = `crypto.randomBytes(32).toString('hex')`
4. Store in Redis: `SET refreshToken:{value} {JSON} EX {TTL}`
5. Return `{ accessToken, refreshToken, expiresIn }`

**`rotateRefreshToken(oldToken: string, deviceId: string)`**
1. `GET refreshToken:{oldToken}` from Redis — throw 401 if missing
2. Verify `payload.deviceId === deviceId`
3. `DEL refreshToken:{oldToken}` — one-time use, delete immediately
4. Call `issueTokenPair(payload.userId, deviceId)` and return

#### Middleware (`auth.middleware.ts`)

```typescript
// authenticate middleware:
// 1. Extract Bearer token from Authorization header
// 2. Verify JWT with public key — throw 401 on failure
// 3. Attach decoded payload to req.user: { userId, deviceId, jti }
// 4. Call next()
// Export: authenticate (required auth), optionalAuthenticate (sets req.user if token present)
```

---

### 8.3 User Module

#### Mongoose Schema (`user.schema.ts`)

```typescript
// DeviceSubSchema (embedded, no _id):
{
  fcmToken: String (required),
  platform: enum ['android', 'ios'] (required),
  lastSeen: Date (default: now)
}

// OAuthProviderSubSchema (embedded, no _id):
{
  provider: enum ['google', 'apple'] (required),
  providerId: String (required),
  email: String
}

// UserSchema:
{
  name: String (required, maxlength 100),
  email: String (required, lowercase, trim),
  avatarKey: String (S3 key — never store full URL),
  oauthProviders: [OAuthProviderSubSchema],
  devices: [DeviceSubSchema] (max 5 per user — enforce in service),
  friendIds: [ObjectId ref User],    // denormalized for fast friend checks
  isDeleted: Boolean (default false),
  deletedAt: Date
}
// timestamps: true

// Indexes:
// { email: 1 } unique
// { 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 } unique
// { name: 'text' }  — text search
// { friendIds: 1 }
// { isDeleted: 1 } partial filter { isDeleted: false }
```

#### Routes

```
GET    /api/v1/users/me              — Own profile
PATCH  /api/v1/users/me              — Update name, avatarKey
DELETE /api/v1/users/me              — Soft delete (set isDeleted, deletedAt, anonymize PII)
GET    /api/v1/users/:id             — Public profile (name, avatarUrl only)
GET    /api/v1/users/search?q=       — Search by name/email (text index, limit 20)
POST   /api/v1/users/me/devices      — Register FCM token
DELETE /api/v1/users/me/devices/:fcmToken — Unregister device
```

#### Service rules

- `getAvatarUrl(avatarKey)`: generate presigned GET URL via CloudFront (not direct S3) — call upload service
- `search(q, requestingUserId)`: exclude deleted users, exclude self, limit to 20 results, return only `{ _id, name, avatarUrl }`
- `deleteAccount(userId)`: set `isDeleted: true`, `deletedAt: now`, set `email: deleted_{userId}@removed`, set `name: 'Deleted User'`, remove all devices and oauthProviders, emit `user.deleted` event on event bus

---

### 8.4 Friend Module

#### Mongoose Schema (`friendship.schema.ts`)

```typescript
{
  requester: ObjectId ref User (required),
  recipient: ObjectId ref User (required),
  status: enum ['pending', 'accepted', 'rejected', 'blocked'] (default 'pending'),
  initiator: ObjectId ref User (required),  // who sent the original request (for block direction)
}
// timestamps: true

// Indexes:
// { requester: 1, recipient: 1 } unique
// { recipient: 1, status: 1 }    — incoming requests query
// { requester: 1, status: 1 }    — outgoing requests query
```

#### Routes

```
POST   /api/v1/friends/request/:userId    — Send friend request
PATCH  /api/v1/friends/request/:id/accept — Accept request
PATCH  /api/v1/friends/request/:id/reject — Reject request
DELETE /api/v1/friends/:userId            — Unfriend (removes from friendIds on both users)
GET    /api/v1/friends                    — List accepted friends (paginated, cursor)
GET    /api/v1/friends/requests/pending   — Incoming pending requests
POST   /api/v1/friends/block/:userId      — Block user
```

#### Service rules

- On accept: update friendship status → `accepted`, then `User.updateOne` for both users to add each other to `friendIds` (use MongoDB session for atomicity)
- On unfriend/reject: remove from `friendIds` on both users in the same session
- Blocked users cannot send friend requests or view each other's profiles
- Check `isDeleted: false` on both users before any operation
- Emit `friend.accepted` event on event bus (notification module listens)

---

### 8.5 Group Module

#### Mongoose Schema (`group.schema.ts`)

```typescript
// GroupMemberSubSchema (embedded, no _id):
{
  userId: ObjectId ref User (required),
  role: enum ['admin', 'member'] (default 'member'),
  joinedAt: Date (default now)
}

// GroupSchema:
{
  name: String (required, maxlength 100),
  type: enum ['trip', 'home', 'couple', 'other'] (default 'other'),
  imageKey: String,
  members: [GroupMemberSubSchema],          // max 100 members — enforce in service
  createdBy: ObjectId ref User (required),
  isActive: Boolean (default true),
  cacheVersion: Number (default 0),         // increment on any change to invalidate Redis cache
}
// timestamps: true

// Indexes:
// { 'members.userId': 1 }     — "find all groups for user"
// { createdBy: 1 }
// { isActive: 1 }
```

#### Routes

```
POST   /api/v1/groups                      — Create group
GET    /api/v1/groups                      — User's groups list
GET    /api/v1/groups/:id                  — Get group + members + summary balances
PATCH  /api/v1/groups/:id                  — Update name, type, imageKey (admin only)
DELETE /api/v1/groups/:id                  — Soft delete (admin only) — set isActive: false
POST   /api/v1/groups/:id/members          — Invite member by userId
DELETE /api/v1/groups/:id/members/:userId  — Remove member (admin or self-leave)
POST   /api/v1/groups/:id/leave            — Leave group (if admin: must transfer or group becomes leaderless)
```

#### Service rules

- Authorization: for any mutation, verify requesting user is a member. For admin-only actions, verify `role: 'admin'`
- On member add: check user is not already a member, is not deleted, and group has < 100 members
- On member remove/leave: check user has zero outstanding debts in this group (warn if not, but allow — debt records remain)
- On group delete: soft delete all expenses in this group (set `isDeleted: true`), emit `group.deleted` event
- Increment `cacheVersion` on every mutation (triggers Redis cache invalidation)

---

### 8.6 Expense Module

#### Mongoose Schema (`expense.schema.ts`)

```typescript
// SplitSubSchema (embedded, no _id):
{
  userId: ObjectId ref User (required),
  amount: Number (required, integer paise, min 0),
  percentage: Number,    // only for splitType 'percentage'
  shares: Number,        // only for splitType 'shares'
  isPaid: Boolean (default false)
}

// CategorySubSchema (embedded, no _id):
{
  name: String (required),
  icon: String,
  color: String         // hex color string
}

// RecurringConfigSubSchema (embedded, no _id):
{
  frequency: enum ['daily', 'weekly', 'monthly'] (required),
  endDate: Date,
  nextRunAt: Date (required)
}

// ExpenseSchema:
{
  groupId: ObjectId ref Group,               // null for personal (friend-to-friend) expenses
  description: String (required, maxlength 200),
  amount: Number (required, integer paise, min 1),
  paidBy: ObjectId ref User (required),
  splitType: enum ['equal', 'exact', 'percentage', 'shares'] (required),
  splits: [SplitSubSchema],                  // EMBEDDED — always read together
  category: CategorySubSchema,               // EMBEDDED — snapshot at creation time
  tags: [String],                            // max 10 tags, each max 30 chars
  receiptKeys: [String],                     // S3 keys, max 5 per expense
  date: Date (required, default now),
  isRecurring: Boolean (default false),
  recurringJobId: String,                    // BullMQ repeatable job ID
  recurringConfig: RecurringConfigSubSchema,
  isDeleted: Boolean (default false),
  deletedAt: Date,
  createdBy: ObjectId ref User (required),
  lastModifiedBy: ObjectId ref User
}
// timestamps: true

// Indexes:
// { groupId: 1, date: -1 }                      — list by group, newest first
// { 'splits.userId': 1, date: -1 }              — personal expense view
// { paidBy: 1, date: -1 }
// { isRecurring: 1, 'recurringConfig.nextRunAt': 1 }  — scheduler query
// Partial index: { isDeleted: 1 } where isDeleted == false
```

#### Routes

```
POST   /api/v1/expenses                      — Create expense
GET    /api/v1/expenses/:id                  — Get single expense
PATCH  /api/v1/expenses/:id                  — Edit expense
DELETE /api/v1/expenses/:id                  — Soft delete expense
GET    /api/v1/groups/:id/expenses           — List expenses by group (paginated)
GET    /api/v1/users/me/expenses             — Personal expenses (paginated)
GET    /api/v1/groups/:id/balances           — Computed balances per member
GET    /api/v1/users/me/balances             — All balances across all groups and friends
POST   /api/v1/expenses/:id/receipts         — Attach receipt key to expense
DELETE /api/v1/expenses/:id/receipts/:key    — Remove receipt from expense
```

#### Split engine (`split-engine.ts`)

This file contains **pure functions only** — no imports from mongoose, redis, or any service.

```typescript
// All functions must be exported and independently unit testable

export interface SplitParticipant {
  userId: string;
  value?: number;   // percentage | exact amount | shares (not needed for equal)
}

export interface SplitResult {
  userId: string;
  amount: number;   // integer paise
}

export function computeEqualSplit(totalAmount: number, participants: string[]): SplitResult[]
// - base = Math.floor(totalAmount / n)
// - remainder = totalAmount - (base * n)
// - Distribute remainder paise to first `remainder` participants (index 0, 1, ...)
// - Guarantee: results.reduce((a,b) => a + b.amount, 0) === totalAmount

export function computeExactSplit(totalAmount: number, participants: SplitParticipant[]): SplitResult[]
// - Validate: sum of values === totalAmount (throw ValidationError if not)
// - Map directly to results

export function computePercentageSplit(totalAmount: number, participants: SplitParticipant[]): SplitResult[]
// - Validate: sum of percentages === 100 (±0.001 tolerance)
// - Compute floor amounts
// - Distribute remainder by Largest Remainder Method
// - Guarantee: results sum === totalAmount

export function computeSharesSplit(totalAmount: number, participants: SplitParticipant[]): SplitResult[]
// - totalShares = sum of all share values
// - Compute floor amounts proportionally
// - Distribute remainder by Largest Remainder Method
// - Guarantee: results sum === totalAmount

export function validateSplitSum(splits: SplitResult[], expectedTotal: number): void
// - Throw ValidationError if sum !== expectedTotal (this is the final guard before DB write)
```

#### Service rules for expense creation (critical — follow exactly)

```typescript
// createExpense() must use a MongoDB session:
async function createExpense(dto, actorId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1. Validate group membership (actor must be in group)
    // 2. Validate paidBy is a group member
    // 3. Validate all split userIds are group members
    // 4. Run split engine — get SplitResult[]
    // 5. Validate split sum === dto.amount (final guard)
    // 6. Create Expense document (within session)
    // 7. Compute debt deltas — call updateDebts(deltas, session)
    // 8. Write SyncEvent entries for all group members (within session)
    // 9. Enqueue audit log job (do NOT write audit log in-session — use queue)
    // 10. Increment group.cacheVersion (within session)
    // 11. Invalidate Redis caches: groupBalances:{groupId}, simplified:{groupId}
    // 12. session.commitTransaction()
    // 13. Emit 'expense.created' event on event bus (after commit — outside transaction)
    return expense;
  } catch(err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
```

#### Debt recomputation (`updateDebts`)

```typescript
// This is called inside the expense creation/edit/delete transaction
// It does NOT recompute all debts from scratch — it applies deltas
// Delta = { from: userId, to: userId, amount: paise }
//   - Positive amount: from owes to
//   - Use Debt.findOneAndUpdate with $inc on amount
//   - If resulting amount becomes 0, delete the debt record
//   - If resulting amount becomes negative (debt reversal): flip from/to, store positive amount
// Use upsert: true with the compound index { from, to, groupId } as the filter
```

---

### 8.7 Settlement Module

#### Mongoose Schema (`settlement.schema.ts`)

```typescript
{
  from: ObjectId ref User (required),         // who paid
  to: ObjectId ref User (required),           // who received
  amount: Number (required, integer paise, min 1),
  groupId: ObjectId ref Group,                // null for personal settlement
  note: String (maxlength 200),
  status: enum ['pending_confirmation', 'confirmed'] (default 'pending_confirmation'),
  confirmedAt: Date,
  createdBy: ObjectId ref User (required),
}
// timestamps: true

// Indexes:
// { from: 1, to: 1, groupId: 1 }
// { from: 1, createdAt: -1 }
// { to: 1, status: 1 }
```

#### Debt schema (`src/modules/settlements/debt.schema.ts`)

```typescript
// NOTE: Debt schema lives in settlements module — it is owned here
{
  from: ObjectId ref User (required),
  to: ObjectId ref User (required),
  groupId: ObjectId ref Group,               // null = personal/direct
  amount: Number (required, integer paise, min 0),
  lastUpdated: Date (default now)
}
// timestamps: true

// Indexes (critical for performance):
// { from: 1, to: 1, groupId: 1 } unique
// { from: 1, groupId: 1 }
// { to: 1, groupId: 1 }
```

#### Routes

```
POST   /api/v1/settlements                   — Record a settlement
GET    /api/v1/groups/:id/settlements        — Settlement history for group (paginated)
GET    /api/v1/groups/:id/simplified         — Simplified debt graph (from Redis or computed)
GET    /api/v1/users/me/settlements          — Personal settlement history (paginated)
PATCH  /api/v1/settlements/:id/confirm       — Recipient confirms the settlement
```

#### Debt simplifier (`debt-simplifier.ts`)

Pure functions only — no DB calls.

```typescript
export interface DebtEdge {
  from: string;
  to: string;
  amount: number;  // always positive integer paise
}

export function simplifyDebts(rawDebts: DebtEdge[]): DebtEdge[]
// Algorithm:
// 1. Compute net balance per person: Map<userId, netAmount>
//    - Creditor (positive net): people owed money
//    - Debtor (negative net): people who owe money
// 2. Separate into creditors[] and debtors[] arrays, sort descending by abs(amount)
// 3. Greedy two-pointer:
//    - settle = min(creditor.amount, debtor.amount)
//    - Push { from: debtor.id, to: creditor.id, amount: settle }
//    - Decrement both; advance pointer that reaches 0
// 4. Return simplified edges — at most N-1 transactions for N people
// Guarantee: result edges sum === input edges sum (conservation of value)
```

#### Service rules for settlement recording

```typescript
// recordSettlement() must use a MongoDB session:
// 1. Validate from/to are group members (if groupId provided)
// 2. Create Settlement document
// 3. Update Debt documents: reduce debt from→to by settlement amount
//    - If debt becomes 0 or negative, handle reversal or deletion
// 4. Write SyncEvent entries for both parties
// 5. Invalidate Redis: groupBalances:{groupId}, simplified:{groupId}
// 6. session.commitTransaction()
// 7. Emit 'settlement.recorded' event on event bus
```

---

### 8.8 Notification Module

#### Mongoose Schema (`notification.schema.ts`)

```typescript
{
  recipientId: ObjectId ref User (required),
  type: enum [
    'EXPENSE_ADDED', 'EXPENSE_EDITED', 'EXPENSE_DELETED',
    'SETTLEMENT_RECORDED', 'SETTLEMENT_CONFIRMED',
    'FRIEND_REQUEST', 'FRIEND_ACCEPTED',
    'GROUP_INVITE', 'RECURRING_EXPENSE_FIRED',
    'REMINDER_YOU_OWE'
  ] (required),
  payload: {
    title: String (required),
    body: String (required),
    imageUrl: String,
    // Domain-specific IDs for deep linking:
    expenseId: ObjectId,
    groupId: ObjectId,
    settlementId: ObjectId,
    actorId: ObjectId,
    actorName: String,
  },
  isRead: Boolean (default false),
  readAt: Date,
  createdAt: Date (default now, indexed for TTL)
}

// Indexes:
// { recipientId: 1, createdAt: -1 }   — notification feed
// { recipientId: 1, isRead: 1 }        — unread count
// { createdAt: 1 } with expireAfterSeconds: 7776000  — 90-day TTL
```

#### Routes

```
GET    /api/v1/notifications               — Feed (paginated, cursor, newest first)
PATCH  /api/v1/notifications/:id/read      — Mark single as read
PATCH  /api/v1/notifications/read-all      — Mark all as read
GET    /api/v1/notifications/unread-count  — { count: N }
GET    /api/v1/notifications/preferences   — Push preferences per type
PATCH  /api/v1/notifications/preferences   — Update preferences
```

#### Notification service — event subscriptions

The notification service subscribes to the internal event bus. On app startup, register all listeners:

```typescript
// In notification.service.ts — call registerEventListeners() once in app.ts startup

eventBus.on('expense.created',       onExpenseCreated)
eventBus.on('expense.edited',        onExpenseEdited)
eventBus.on('expense.deleted',       onExpenseDeleted)
eventBus.on('settlement.recorded',   onSettlementRecorded)
eventBus.on('settlement.confirmed',  onSettlementConfirmed)
eventBus.on('friend.request.sent',   onFriendRequestSent)
eventBus.on('friend.accepted',       onFriendAccepted)
eventBus.on('group.invite',          onGroupInvite)
```

Each handler must:
1. Determine recipient list (exclude the actor who triggered the event)
2. For each recipient: `Notification.create({ recipientId, type, payload })` (bulk insert preferred)
3. Enqueue BullMQ job `push:fcm` for each recipient with `{ recipientId, notificationId }`

---

### 8.9 File Upload Module

#### Routes

```
POST   /api/v1/uploads/presign        — Generate S3 presigned PUT URL
DELETE /api/v1/uploads/:key           — Delete file from S3 (own files only)
```

#### Presign request/response

```typescript
// Request body (Zod validated):
{
  fileType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf',
  fileSize: number,   // bytes
  context: 'receipt' | 'avatar' | 'group-image'
}

// Response:
{
  uploadUrl: string,    // presigned S3 PUT URL, expires in env.UPLOAD_PRESIGN_TTL_SECONDS
  key: string,          // S3 key to store in DB
  downloadUrl: string   // CloudFront URL (public for avatars, presigned for receipts)
}
```

#### Service rules

```typescript
// Key structure:
// receipts/{userId}/{uuid}.{ext}         — private, presigned access
// avatars/{userId}/{uuid}.{ext}          — public via CloudFront
// group-images/{groupId}/{uuid}.{ext}    — public via CloudFront

// Validation before generating URL:
// - fileType must be in allowlist
// - fileSize must be <= env.MAX_FILE_SIZE_BYTES (10MB)
// - context must map to allowed bucket prefix

// PutObjectCommand params:
// - ContentType: fileType
// - ContentLength: fileSize
// - Metadata: { uploadedBy: userId }
// - For receipts: no public-read ACL (bucket is private)
// - URL expires in: env.UPLOAD_PRESIGN_TTL_SECONDS (default 300s)

// For download URLs:
// - Avatars/group-images: return CloudFront URL directly (public)
// - Receipts: generate presigned GetObject URL (1 hour TTL)
```

---

### 8.10 Sync Module

#### Mongoose Schema (`sync.schema.ts`)

```typescript
{
  userId: ObjectId ref User (required),
  entityType: enum ['expense', 'group', 'settlement', 'friend', 'debt', 'notification'],
  entityId: ObjectId (required),
  action: enum ['create', 'update', 'delete'] (required),
  version: Number (required),              // monotonic per user, from Redis INCR
  payload: Schema.Types.Mixed,             // full entity snapshot — denormalized
  createdAt: Date (default now)
}

// Indexes:
// { userId: 1, version: 1 }               — delta sync query (most important index)
// { createdAt: 1 } with expireAfterSeconds: 2592000  — 30-day TTL
```

#### Routes

```
GET    /api/v1/sync?since=<version>&deviceId=<id>   — Pull changes since version
POST   /api/v1/sync/ack                              — Acknowledge receipt of events
POST   /api/v1/sync/push                             — Push offline-created changes
```

#### Service rules

```typescript
// getSyncDelta(userId, sinceVersion, deviceId):
// 1. Fetch all SyncEvents where userId = userId AND version > sinceVersion
// 2. Order by version ASC (so client can apply in order)
// 3. Return up to 500 events per call — if more exist, set hasMore: true
// 4. Store latest served version in Redis: cursor:{userId}:{deviceId} = maxVersion

// getNextVersion(userId):
// Redis INCR user:{userId}:syncVersion — returns monotonically increasing integer

// pushOfflineChanges(userId, deviceId, changes[]):
// For each change in order:
//   - Deduplicate by localId (client-side UUID) — check if already processed
//   - Route to appropriate service method (createExpense, etc.)
//   - On conflict (server has newer version of same entity): server wins
//   - Return results array with { localId, serverId, status: 'ok' | 'conflict' | 'error' }
```

---

### 8.11 Audit Log Module

This module has no HTTP routes. It is consumed internally by other modules via queue (do not call audit service synchronously in transactions — enqueue a BullMQ job instead).

#### Mongoose Schema (`audit.schema.ts`)

```typescript
{
  actorId: ObjectId ref User (required),
  action: String (required),             // e.g. 'expense.create', 'group.member.remove'
  entityType: String (required),         // e.g. 'expense', 'group', 'settlement'
  entityId: ObjectId (required),
  groupId: ObjectId,                     // for scoped activity feeds
  before: Schema.Types.Mixed,            // state before change (omit for creates)
  after: Schema.Types.Mixed,             // state after change (omit for deletes)
  metadata: {
    ip: String,
    userAgent: String,
    requestId: String
  },
  createdAt: Date (default now)
}

// Indexes:
// { entityId: 1, createdAt: -1 }
// { groupId: 1, createdAt: -1 }          — group activity feed
// { actorId: 1, createdAt: -1 }          — personal activity feed
// { createdAt: 1 } with expireAfterSeconds: 15552000  — 180-day TTL
```

#### Public API (internal only)

```typescript
// audit.service.ts exports:
export function buildAuditJob(params: AuditJobParams): AuditJobData
// Returns a serializable object for BullMQ job — does NOT write to DB directly

// The actual DB write happens in audit.worker.ts
```

---

### 8.12 BullMQ Workers

Workers run as a **separate process** (`src/workers/index.ts`) — they are not part of the Express API process.

#### Queue names and responsibilities

```
Queue: 'push:fcm'
  Job data: { recipientId: string, notificationId: string }
  Worker: src/workers/fcm.worker.ts
  Concurrency: 50
  Options: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
  Logic:
    1. Fetch notification from DB by notificationId
    2. Fetch user devices (FCM tokens) from User document
    3. Filter out stale tokens (lastSeen > 30 days)
    4. Call firebase.messaging().sendEachForMulticast({ tokens, notification, data })
    5. Handle UNREGISTERED token errors: remove stale tokens from user.devices

Queue: 'audit:write'
  Job data: AuditJobData (see audit module)
  Worker: src/workers/audit.worker.ts
  Concurrency: 100
  Options: { attempts: 2 }
  Logic: AuditLog.create(jobData)

Queue: 'expense:recurring'
  Job data: { expenseId: string }
  Worker: src/workers/recurring.worker.ts
  Concurrency: 10
  Logic:
    1. Fetch original expense
    2. Clone it with new date = now, new recurringConfig.nextRunAt
    3. Call expenseService.createExpense() (this runs the full transaction)
    4. Emit 'recurring.expense.fired' notification event
    5. If nextRunAt > endDate: remove repeatable job

Queue: 'debt:recompute'
  Job data: { groupId: string }
  Worker: src/workers/debt-recompute.worker.ts
  Concurrency: 20
  Logic: Recompute all debts for group from scratch (used for data correction only)
  NOTE: Normal expense operations update debts in-transaction via delta — this queue
        is only used for admin correction or post-migration consistency fixes
```

#### Worker process entry point (`src/workers/index.ts`)

```typescript
// On startup:
// 1. Validate env (import env config)
// 2. Connect MongoDB
// 3. Connect Redis
// 4. Initialize all workers
// 5. Handle graceful shutdown: call worker.close() for each worker on SIGTERM
// Log worker events: completed, failed, stalled
```

---

## 9. Shared Utilities

Every agent must use these utilities. Do not re-implement them.

### `src/shared/utils/logger.ts`

```typescript
// Export a pino logger instance configured for the current NODE_ENV:
// - development: pretty print
// - production: JSON, log level = 'info'
// - test: log level = 'silent'
// Also export a child logger factory: createLogger(module: string)
// Usage: const log = createLogger('expense.service')
//        log.info({ expenseId }, 'Expense created')
```

### `src/shared/utils/pagination.ts`

```typescript
// Cursor-based pagination — DO NOT use skip/offset anywhere in the codebase

export interface CursorPayload {
  _id: string;
  date: string;   // ISO string
}

export function encodeCursor(payload: CursorPayload): string
// Base64url encode the JSON payload

export function decodeCursor(cursor: string): CursorPayload
// Base64url decode — throw ValidationError if malformed

export function buildCursorQuery(cursor?: string): Record<string, unknown>
// Returns Mongoose query fragment:
// If cursor: { $or: [{ date: { $lt: cursorDate } }, { date: cursorDate, _id: { $lt: cursorId } }] }
// If no cursor: {}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    count: number;
  };
}

export function buildPaginatedResult<T extends { _id: unknown; date?: unknown }>(
  items: T[],
  limit: number
): PaginatedResult<T>
// If items.length === limit + 1: hasMore = true, pop last item, encode cursor from last item
// Else: hasMore = false, nextCursor = null
// Always fetch limit + 1 from DB to detect hasMore
```

### `src/shared/utils/cache.ts`

```typescript
// Generic cache-aside helpers

export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T>
// 1. Try redis.get(key)
// 2. If hit: JSON.parse and return
// 3. If miss: call fetchFn(), redis.set(key, JSON.stringify(result), 'EX', ttlSeconds), return result

export async function invalidateKeys(...keys: string[]): Promise<void>
// redis.del(...keys)

// Standard cache key patterns (use these constants — do not invent new patterns):
export const CacheKeys = {
  groupBalances: (groupId: string) => `balances:${groupId}`,
  simplifiedDebts: (groupId: string) => `simplified:${groupId}`,
  userGroups: (userId: string) => `userGroups:${userId}`,
  syncCursor: (userId: string, deviceId: string) => `cursor:${userId}:${deviceId}`,
  userSyncVersion: (userId: string) => `user:${userId}:syncVersion`,
} as const;
```

### `src/shared/errors/AppError.ts`

```typescript
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,      // e.g. 'NOT_FOUND', 'VALIDATION_ERROR'
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
// Subclasses: ValidationError (400), NotFoundError (404),
//             ForbiddenError (403), ConflictError (409), UnauthorizedError (401)
```

### `src/shared/middleware/error-handler.ts`

```typescript
// Global Express error handler — must be registered last in app.ts
// Catches all errors thrown in route handlers and services
// Maps AppError subclasses to appropriate HTTP responses
// For unknown errors: log full stack, return 500 { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', requestId } }
// Never expose stack traces in production responses
// Always include requestId in error response
```

### `src/shared/middleware/validate.ts`

```typescript
// Zod validation middleware factory:
export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw new ValidationError('Validation failed', result.error.issues);
    }
    req[target] = result.data;  // Replace with parsed/transformed data
    next();
  };
}
```

### `src/shared/events/event-bus.ts`

```typescript
// Internal EventEmitter singleton
// Typed event map — add events here as modules define them:
interface EventMap {
  'expense.created':       { expense: IExpense; actor: IUser };
  'expense.edited':        { expense: IExpense; actor: IUser; before: Partial<IExpense> };
  'expense.deleted':       { expense: IExpense; actor: IUser };
  'settlement.recorded':   { settlement: ISettlement; actor: IUser };
  'settlement.confirmed':  { settlement: ISettlement; actor: IUser };
  'friend.request.sent':   { friendship: IFriendship; actor: IUser };
  'friend.accepted':       { friendship: IFriendship; actor: IUser };
  'group.invite':          { group: IGroup; invitee: IUser; actor: IUser };
  'group.deleted':         { group: IGroup; actor: IUser };
  'user.deleted':          { userId: string };
  'recurring.expense.fired': { expense: IExpense };
}

export const eventBus: TypedEventEmitter<EventMap>;
```

---

## 10. Database Conventions

All agents must follow these rules for every schema they create.

### Money

- **Always integers.** Amount fields are `Number` in Mongoose but enforced as integers (no decimals) at the service layer and split engine.
- Field name for money amounts: always `amount` (not `value`, `price`, `cost`)
- Unit: paise (₹1 = 100 paise)

### Soft deletes

- Use `isDeleted: Boolean (default false)` + `deletedAt: Date`
- Always add a partial index: `{ isDeleted: 1 }` with `partialFilterExpression: { isDeleted: false }`
- All list queries must include `{ isDeleted: false }` filter automatically at the service layer

### Embedded vs referenced (do not deviate from this)

| What | Decision | Reason |
|---|---|---|
| `expense.splits[]` | **Embed** | Always read with expense; bounded (≤100 members); never queried alone |
| `expense.category` | **Embed** | Snapshot — history must not change if category is renamed |
| `group.members[]` | **Embed** | Bounded (≤100); always needed with group |
| `user.devices[]` | **Embed** | Bounded (≤5); always needed for push |
| `user.oauthProviders[]` | **Embed** | Bounded; always read with user |
| `debts` | **Separate collection** | Queried independently; needs compound indexes |
| `audit_logs` | **Separate collection** | Unbounded growth; queried independently by time |
| `notifications` | **Separate collection** | High write volume; queried by recipient independently |
| `sync_events` | **Separate collection** | Append-only; TTL'd; queried by userId + version |

### Indexes

Every agent must create indexes for their schemas in `scripts/create-indexes.ts`. This script is idempotent (uses `createIndex` with `background: true`). Do not rely on Mongoose `autoIndex` in production.

### Timestamps

All schemas must have `{ timestamps: true }` — this adds `createdAt` and `updatedAt` automatically.

### ObjectId vs String for IDs

- Always use `ObjectId` for cross-collection references (not strings)
- Always use `.lean()` for read-only queries (avoids hydrating full Mongoose documents, 2-3x faster)
- Always populate references explicitly — never rely on Mongoose populate for hot paths; prefer lookup aggregations

---

## 11. API Conventions

### Request/response envelope

All responses use this shape:

```typescript
// Success:
{ "data": <payload>, "meta": { "requestId": "..." } }

// Paginated success:
{ "data": [...], "pagination": { "hasMore": bool, "nextCursor": string | null, "count": number }, "meta": { "requestId": "..." } }

// Error:
{ "error": { "code": "SNAKE_CASE_STRING", "message": "Human readable", "details": [...] | null, "requestId": "..." } }
```

### HTTP status codes

| Situation | Code |
|---|---|
| Created a resource | 201 |
| Success, returns data | 200 |
| Success, no body (e.g. delete) | 204 |
| Validation error | 400 |
| Not authenticated | 401 |
| Not authorized | 403 |
| Resource not found | 404 |
| Conflict (duplicate, version mismatch) | 409 |
| Rate limited | 429 |
| Server error | 500 |

### Pagination

- All list endpoints accept `?limit=<n>&cursor=<string>`
- Default limit: 20. Max limit: 100. Enforce in route validation.
- Cursor is base64url-encoded `{ _id, date }` — use `pagination.ts` utilities
- Always sort by `{ date: -1, _id: -1 }` for consistency

### Versioning

- All routes under `/api/v1/`
- Breaking changes get `/api/v2/` — never modify existing v1 responses

### Authorization pattern (every protected route must do this)

```typescript
// 1. Verify user is authenticated (auth middleware sets req.user)
// 2. Verify user has access to the requested resource:
//    - For group resources: verify req.user.userId is in group.members[].userId
//    - For user resources: verify req.user.userId === resource.userId
//    - For expense: verify req.user.userId is in expense.splits[].userId OR expense.paidBy
// 3. For admin actions: verify role === 'admin' in group.members
// Never return 403 with information about whether the resource exists (return 404 instead)
```

---

## 12. Testing Requirements

### What to test

Every agent must write tests for the code they produce. Minimum coverage per module:

- **Split engine** (`split-engine.ts`): 100% coverage — test every split type, remainder distribution, rounding edge cases, and sum validation. These are pure functions — easy to test.
- **Debt simplifier** (`debt-simplifier.ts`): 100% coverage — test conservation of value, minimum transaction count, circular debts.
- **Service layer**: Integration tests with MongoDB in-memory (use `mongodb-memory-server`).
- **Routes**: Supertest integration tests — test auth, validation, happy path, and error cases.

### Test setup (`tests/helpers/db.ts`)

```typescript
// Uses mongodb-memory-server for isolated test DB
// beforeAll: start in-memory MongoDB, connect mongoose
// afterEach: clear all collections (not drop — faster)
// afterAll: disconnect, stop in-memory server
```

### Test naming convention

```typescript
describe('ExpenseService', () => {
  describe('createExpense', () => {
    it('should create equal split and distribute remainder to first participant', ...)
    it('should rollback transaction if debt update fails', ...)
    it('should throw ValidationError if split amounts do not sum to total', ...)
    it('should write sync events for all group members', ...)
  });
});
```

### Running tests

```bash
npm test                   # all tests
npm run test:unit          # unit tests only (no DB needed)
npm run test:integration   # integration tests (spins up MongoDB in memory)
npm run test:coverage      # with coverage report
```

---

## 13. Docker & CI/CD

### `Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

### `docker-compose.yml` (local development)

```yaml
version: '3.9'
services:
  api:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [mongo, redis]
    volumes: ["./src:/app/src"]

  worker:
    build: .
    command: ["node", "dist/workers/index.js"]
    env_file: .env
    depends_on: [mongo, redis]

  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mongo-express:            # Dev only — remove in staging
    image: mongo-express
    ports: ["8081:8081"]
    environment:
      ME_CONFIG_MONGODB_URL: mongodb://mongo:27017/

volumes:
  mongo_data:
```

### `package.json` scripts

```json
{
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "start": "node dist/server.js",
    "start:worker": "node dist/workers/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "dev:worker": "ts-node-dev --respawn --transpile-only src/workers/index.ts",
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "seed": "ts-node scripts/seed.ts",
    "create-indexes": "ts-node scripts/create-indexes.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

### GitHub Actions (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build

  docker-build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      - run: aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
      - run: |
          docker build -t ${{ secrets.ECR_REGISTRY }}/splitpro-api:${{ github.sha }} .
          docker push ${{ secrets.ECR_REGISTRY }}/splitpro-api:${{ github.sha }}
      - run: |
          aws ecs update-service \
            --cluster splitpro-prod \
            --service splitpro-api \
            --force-new-deployment \
            --region ap-south-1
```

---

## 14. Security Checklist

Before marking any module `DONE`, verify each applicable item:

- [ ] All routes (except `/health`, `/auth/oauth/*`, `/auth/refresh`) protected by `authenticate` middleware
- [ ] All request bodies validated with Zod before entering service layer
- [ ] No raw MongoDB query strings built from user input (use Mongoose schema validation)
- [ ] Authorization check: user can only access resources they belong to
- [ ] Money amounts validated as positive integers (no floats, no negatives)
- [ ] File upload: `fileType` validated against allowlist before presigning
- [ ] File upload: `fileSize` validated against max before presigning
- [ ] No stack traces in production error responses
- [ ] No PII (email, name) in log entries — log userId only
- [ ] Rate limiting applied to all auth endpoints
- [ ] JWT verification uses the public key (RS256) — not `algorithm: 'none'`
- [ ] Refresh tokens deleted immediately on use (one-time use enforced)
- [ ] S3 bucket has no public-read ACL for receipts
- [ ] All `ObjectId` parameters validated with `z.string().regex(/^[0-9a-fA-F]{24}$/)` before use
- [ ] MongoDB transactions used for all multi-document writes
- [ ] Deleted users (`isDeleted: true`) excluded from all queries

---

## 15. Shared Agent Log

> **This section is append-only. Do not edit or delete existing entries.**
> **Every agent must write here BEFORE starting work and AFTER completing work.**
> **Always read ALL existing entries before adding your own.**

---

### [INITIAL] [PLAYBOOK_AUTHOR] [DONE] — Playbook created

**Status:** DONE
**Agent:** Playbook Author (Claude)
**Files touched:**
- SPLITPRO_BACKEND_PLAYBOOK.md (created)

**Summary:**
Created the complete multi-agent development playbook. This document defines the full project structure, module specifications, database conventions, API conventions, testing requirements, and the shared log protocol. All agents must read this document completely before beginning any work.

**Dependencies needed from other agents:** None — this is the root document.

**Blockers:** None

**Follow-up TODOs:**
- Agent: implement Phase 1 (shared utilities + config) first
- Agent: verify Node 20 and TypeScript 5.4 are available in your environment before starting
- Agent: copy `.env.example` to `.env` and fill in values before running anything
---

<!-- 
=== AGENTS: ADD YOUR LOG ENTRIES BELOW THIS LINE ===
Copy the template from Section 3 exactly.
Do not remove this comment or the entries above it.
-->

### [2026-04-05T01:24:00+05:30] [Antigravity-Session-1] [DONE] — Phase 1: Foundation + Phase 2: Identity + Phase 3: Social Graph + Phase 4: Core Domain + Phase 5: Supporting Services

**Status:** DONE
**Agent:** Antigravity-Session-1 (Google DeepMind Antigravity)
**Files touched:**
- package.json (created)
- tsconfig.json (created)
- jest.config.ts (created — with setupFiles pointing to tests/jest.setup.ts)
- .eslintrc.json (created)
- .gitignore (created)
- .env.example (created)
- Dockerfile (created)
- docker-compose.yml (created)
- .github/workflows/ci.yml (created)
- src/shared/errors/AppError.ts (created)
- src/shared/errors/ValidationError.ts (created)
- src/shared/errors/NotFoundError.ts (created)
- src/shared/errors/ForbiddenError.ts (created)
- src/shared/errors/ConflictError.ts (created)
- src/shared/errors/UnauthorizedError.ts (created)
- src/shared/utils/logger.ts (created)
- src/shared/utils/pagination.ts (created)
- src/shared/utils/currency.ts (created)
- src/shared/utils/cache.ts (created)
- src/shared/events/event-bus.ts (created)
- src/shared/middleware/error-handler.ts (created)
- src/shared/middleware/rate-limiter.ts (created)
- src/shared/middleware/request-id.ts (created)
- src/shared/middleware/validate.ts (created)
- src/config/env.ts (created)
- src/config/database.ts (created)
- src/config/redis.ts (created)
- src/config/s3.ts (created)
- src/config/fcm.ts (created)
- src/app.ts (created)
- src/server.ts (created)
- src/modules/users/* (created — schema, model, types, service, controller, routes)
- src/modules/auth/* (created — types, middleware, service, controller, routes)
- src/modules/friends/* (created — schema, model, types, service, controller, routes)
- src/modules/groups/* (created — schema, model, types, service, controller, routes)
- src/modules/audit/* (created — schema, model, service)
- src/modules/sync/* (created — schema, model, service, controller, routes)
- src/modules/expenses/* (created — schema, model, types, split-engine, recurring.service, service, controller, routes)
- src/modules/settlements/* (created — schema, model, types, debt-simplifier, service, controller, routes)
- src/modules/notifications/* (created — schema, model, types, service, controller, routes)
- src/modules/uploads/* (created — service, controller, routes)
- src/workers/fcm.worker.ts (created)
- src/workers/audit.worker.ts (created)
- src/workers/recurring.worker.ts (created)
- src/workers/debt-recompute.worker.ts (created)
- src/workers/index.ts (created)
- tests/jest.setup.ts (created — env var stubs for integration tests)
- tests/helpers/db.ts (created — MongoMemoryReplSet for transaction support)
- tests/helpers/fixtures.ts (created)
- tests/unit/split-engine.test.ts (created)
- tests/unit/debt-simplifier.test.ts (created)
- tests/integration/expense-settlement.test.ts (created)
- scripts/seed.ts (created)
- scripts/create-indexes.ts (created)

**Summary:**
All phases (1-5) implemented in full. Key architectural rules strictly followed:
- All money as integers (paise) — enforced via Zod `z.number().int()` on routes AND the split-engine's `validateSplitSum()` guard before every DB write
- MongoDB transactions for all financial writes (createExpense, recordSettlement, acceptFriendRequest, unfriend, blockUser, removeMember)
- Cursor-based pagination throughout (no offset/page)
- BullMQ workers for audit log writes (off the hot path), FCM push, recurring expenses, and debt recompute
- Notification event listeners registered once at app startup, connected to all expense/settlement/friend/group events
- Debt simplifier is read-only (never persists simplified graph)
- RS256 JWT with one-time-use refresh token rotation enforced in Redis
- Presigned S3 uploads with content-type allowlist and size validation

**Test results:**
- `tsc --noEmit`: exit 0, 0 errors
- Unit tests: 32/32 pass (split-engine + debt-simplifier)
- Integration tests: 6/6 pass (expense creation, debt tracking, settlement, simplification)
- Total: **38/38 tests pass**

**Blockers:** None
**Follow-up TODOs:**
- Populate `.env` file with real credentials before `npm run dev`
- Run `npm run create-indexes` against a real MongoDB instance before first startup
- Run `npm run seed` to create development data
- Set up replica set in production MongoDB (required for transactions)
---
