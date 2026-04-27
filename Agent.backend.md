# Agent.backend.md — Backend Development Agent Prompt

## 🧠 Role & Context

You are a senior backend engineer working on a **real-time chat and video calling application** called **"Us"**. The backend is already scaffolded. Your job is to implement all features described below by writing production-quality TypeScript code that fits perfectly into the existing project structure.

---

## 🗂️ Project Structure

```
backend/
├── prisma/                        # Prisma schema and migrations
├── src/
│   ├── assets/                    # Static assets
│   ├── configs/
│   │   ├── prisma/                # Prisma client singleton
│   │   ├── rabbitmq/              # RabbitMQ connection and channel setup
│   │   └── radis/                 # Redis client setup
│   ├── generated/                 # Prisma generated types
│   ├── modules/
│   │   ├── auth/                  # Auth module (routes, controller, service)
│   │   ├── chat/                  # Chat module (routes, controller, service)
│   │   └── user/                  # User module (routes, controller, service)
│   ├── packages/
│   │   ├── constants/             # App-wide constants
│   │   ├── error-handler/         # Global error handler
│   │   ├── middlewares/           # Auth middleware, validators, etc.
│   │   ├── sendMail/              # Email/OTP sending utility
│   │   └── types/                 # Shared TypeScript types
│   └── main.ts                    # App entry point (Express + WS + WebRTC signaling)
├── .env
├── docker-compose.yml
├── docker-compose.local.yml
├── Dockerfile
├── nginx.conf
├── prisma.config.ts
└── tsconfig.json
```

---

## 🛠️ Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma + PostgreSQL
- **Cache / Pub-Sub**: Redis
- **Message Queue**: RabbitMQ
- **Real-time**: WebSocket (`ws` library)
- **Video Calling**: WebRTC (signaling via WebSocket)
- **Auth**: JWT (access + refresh tokens), OTP via SMS/Email
- **File Upload**: Multer + local or S3 storage
- **Validation**: Zod or express-validator
- **Package Manager**: pnpm

---

## 📦 Prisma Schema Requirements

Design and implement the following models in `prisma/schema.prisma`:

### User
```
id, fullName, username, mobileNumber, email (optional),
passwordHash, profilePicture, bio, isVerified,
isOnline, lastSeen (DateTime), createdAt, updatedAt
```

### OTP
```
id, userId, code (6-digit), type (SIGNUP | RESET_PASSWORD),
expiresAt, isUsed, createdAt
```

### Conversation
```
id, isGroup, createdAt, updatedAt
→ participants: ConversationParticipant[]
→ messages: Message[]
```

### ConversationParticipant
```
id, conversationId, userId, joinedAt
```

### Message
```
id, conversationId, senderId, content, mediaUrl, mediaType,
messageType (TEXT | IMAGE | VIDEO | AUDIO | FILE),
sentAt, deliveredAt, readAt
→ readReceipts: MessageReadReceipt[]
```

### MessageReadReceipt
```
id, messageId, userId, readAt
```

---

## 🔐 Auth Module (`src/modules/auth/`)

### File Structure
```
auth/
├── auth.routes.ts
├── auth.controller.ts
├── auth.service.ts
└── auth.validator.ts
```

### Endpoints

#### POST `/api/auth/signup`
- Accept: `{ fullName, username, mobileNumber, password, confirmPassword }`
- Hash password with bcrypt (rounds: 12)
- Create user with `isVerified: false`
- Generate 6-digit OTP, store in `OTP` table with 10-min expiry
- Send OTP via SMS (use `src/packages/sendMail/` — adapt for SMS or use a mock)
- Queue OTP delivery via **RabbitMQ** (`otp.queue`)
- Return: `{ message: "OTP sent", userId }`

#### POST `/api/auth/verify-otp`
- Accept: `{ userId, otp }`
- Validate OTP from DB (check expiry, isUsed)
- Mark OTP as used, set `user.isVerified = true`
- Generate JWT access token (15m) and refresh token (7d)
- Store refresh token hash in Redis: `refresh:{userId}`
- Return: `{ accessToken, refreshToken, user }`

#### POST `/api/auth/login`
- Accept: `{ mobileNumber, password }`
- Verify user exists and `isVerified: true`
- Compare password hash
- Generate tokens
- Update `user.isOnline = true`, `user.lastSeen = now()`
- Return: `{ accessToken, refreshToken, user }`

#### POST `/api/auth/logout`
- Protected route (requires JWT)
- Delete refresh token from Redis
- Update `user.isOnline = false`, `user.lastSeen = now()`
- Broadcast last-seen update via WebSocket

#### POST `/api/auth/forgot-password`
- Accept: `{ mobileNumber }`
- Find user, generate OTP of type `RESET_PASSWORD`
- Queue OTP via RabbitMQ
- Return: `{ message: "OTP sent", userId }`

#### POST `/api/auth/reset-password`
- Accept: `{ userId, otp, newPassword, confirmPassword }`
- Validate OTP
- Hash new password, update user
- Invalidate all existing refresh tokens in Redis
- Return: `{ message: "Password reset successful" }`

#### POST `/api/auth/refresh-token`
- Accept: `{ refreshToken }`
- Validate refresh token against Redis
- Issue new access token
- Return: `{ accessToken }`

---

## 💬 Chat Module (`src/modules/chat/`)

### File Structure
```
chat/
├── chat.routes.ts
├── chat.controller.ts
├── chat.service.ts
└── chat.gateway.ts       # WebSocket event handlers
```

### REST Endpoints

#### GET `/api/chat/conversations`
- Protected route
- Return all conversations for current user
- Include: last message, unread count, participant info, online status, lastSeen

#### POST `/api/chat/conversations`
- Accept: `{ participantId }`
- Find or create 1-on-1 conversation
- Return conversation object

#### GET `/api/chat/conversations/:conversationId/messages`
- Protected route
- Paginated: `?page=1&limit=30`
- Mark messages as delivered on fetch
- Return messages array with read receipts

#### POST `/api/chat/conversations/:conversationId/messages`
- Accept: `{ content, messageType }` or multipart for media
- Create message in DB
- Publish to RabbitMQ: `chat.message.{conversationId}`
- Return created message

#### POST `/api/chat/conversations/:conversationId/read`
- Mark all unread messages as read
- Update `MessageReadReceipt`
- Emit read receipt via WebSocket

---

## 🔌 WebSocket Gateway (`src/main.ts` + `chat.gateway.ts`)

### Setup in `main.ts`
```typescript
// Attach WebSocket server to HTTP server
// ws.Server({ server: httpServer })
// Handle upgrade requests with JWT auth middleware
```

### WebSocket Event Protocol

Use JSON messages with structure:
```json
{ "type": "EVENT_TYPE", "payload": { ... } }
```

### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `NEW_MESSAGE` | `{ message, conversationId }` | New message received |
| `MESSAGE_DELIVERED` | `{ messageId, conversationId }` | Message delivered |
| `MESSAGE_READ` | `{ messageId, userId, readAt }` | Message read |
| `USER_ONLINE` | `{ userId, isOnline, lastSeen }` | User presence update |
| `TYPING_START` | `{ userId, conversationId }` | User started typing |
| `TYPING_STOP` | `{ userId, conversationId }` | User stopped typing |
| `CALL_OFFER` | `{ callId, from, sdp }` | Incoming video call |
| `CALL_ANSWER` | `{ callId, sdp }` | Call accepted with SDP answer |
| `CALL_ICE_CANDIDATE` | `{ callId, candidate }` | ICE candidate exchange |
| `CALL_END` | `{ callId, reason }` | Call terminated |
| `CALL_REJECTED` | `{ callId }` | Call rejected by callee |

### Client → Server Events

| Event | Payload |
|---|---|
| `SEND_MESSAGE` | `{ conversationId, content, messageType }` |
| `MESSAGE_DELIVERED` | `{ messageId }` |
| `MESSAGE_READ` | `{ messageId, conversationId }` |
| `TYPING_START` | `{ conversationId }` |
| `TYPING_STOP` | `{ conversationId }` |
| `CALL_OFFER` | `{ toUserId, sdp }` |
| `CALL_ANSWER` | `{ callId, sdp }` |
| `CALL_ICE_CANDIDATE` | `{ callId, candidate }` |
| `CALL_END` | `{ callId }` |
| `CALL_REJECT` | `{ callId }` |

### Online Presence Logic
- On WebSocket connect: set `user.isOnline = true` in Redis key `presence:{userId}`
- On disconnect: set `user.isOnline = false`, update `user.lastSeen` in DB
- Broadcast presence change to all conversation participants via WebSocket
- Redis TTL on presence key: 30 seconds (heartbeat required)
- Client sends `HEARTBEAT` every 20s; server resets TTL

---

## 📹 WebRTC Signaling (via WebSocket)

The backend acts as a **signaling server only** — it relays SDP offers/answers and ICE candidates between peers. No media passes through the server.

### Signaling Flow

```
Caller                   Server                   Callee
  |                        |                        |
  |--CALL_OFFER(sdp)-----→|                        |
  |                        |--CALL_OFFER(sdp)-----→|
  |                        |←--CALL_ANSWER(sdp)----|
  |←--CALL_ANSWER(sdp)----|                        |
  |--ICE_CANDIDATE--------→|                        |
  |                        |--ICE_CANDIDATE--------→|
  |←------------------------ICE_CANDIDATE-----------|
  |                        |                        |
  [P2P video stream established directly]
```

### Call State Management in Redis
```
call:{callId} → { callerId, calleeId, status: RINGING|ACTIVE|ENDED, startedAt }
TTL: 60s (auto-expire if not answered)
```

---

## 👤 User Module (`src/modules/user/`)

### Endpoints

#### GET `/api/user/profile`
- Protected. Return current user profile.

#### PUT `/api/user/profile`
- Accept: `{ fullName, username, bio }`
- Update user profile

#### POST `/api/user/profile/picture`
- Multipart upload
- Save to storage, update `user.profilePicture`

#### GET `/api/user/search?q=`
- Search users by username or mobile number
- Exclude current user from results

#### GET `/api/user/:userId`
- Return public profile: `{ id, fullName, username, profilePicture, isOnline, lastSeen }`

---

## 🐇 RabbitMQ Configuration (`src/configs/rabbitmq/`)

### Queues to Configure
```typescript
const QUEUES = {
  OTP: 'otp.queue',
  CHAT_MESSAGE: 'chat.message',
  NOTIFICATION: 'notification.queue',
}
```

### Consumer Setup
- `otp.queue` consumer: sends OTP via SMS/email service
- `chat.message` consumer: handles message persistence + WebSocket fan-out
- Run consumers in `main.ts` after app boot

---

## 🔴 Redis Usage (`src/configs/radis/`)

| Key Pattern | Value | TTL | Purpose |
|---|---|---|---|
| `refresh:{userId}` | refreshTokenHash | 7d | Refresh token store |
| `presence:{userId}` | `{ isOnline, lastSeen }` | 30s | User online status |
| `call:{callId}` | call state JSON | 60s | Active call state |
| `typing:{conversationId}:{userId}` | `1` | 5s | Typing indicator |
| `otp_attempts:{userId}` | count | 15m | Rate limit OTP attempts |

---

## 🛡️ Middleware (`src/packages/middlewares/`)

### `authenticate.ts`
- Extract Bearer token from `Authorization` header
- Verify JWT, attach `req.user` to request
- Return 401 if invalid

### `rateLimiter.ts`
- Use Redis to rate limit: 5 OTP requests per mobile number per 15 minutes
- 100 requests per IP per minute for general routes

### `validateRequest.ts`
- Zod schema validation wrapper
- Return 422 with field errors on failure

### `upload.ts`
- Multer config for image/video uploads
- Max file size: 10MB images, 50MB videos
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`

---

## 📧 OTP / Mail Package (`src/packages/sendMail/`)

```typescript
// sendOtp.ts
export async function sendOtp(params: {
  mobileNumber: string;
  otp: string;
  type: 'SIGNUP' | 'RESET_PASSWORD';
}): Promise<void>

// Queue the OTP message to RabbitMQ otp.queue
// In development: log OTP to console
// In production: integrate with Twilio / MSG91 / AWS SNS
```

---

## ⚙️ Environment Variables (`.env`)

```env
# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/us_app

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OTP
OTP_EXPIRY_MINUTES=10

# File Storage
UPLOAD_DIR=uploads/
MAX_FILE_SIZE_MB=10

# SMS (Twilio / MSG91)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## 📐 Code Standards

1. **All files in TypeScript** — no `any` types, use Prisma generated types
2. **Error handling** — use the existing `error-handler` package, wrap async routes with `asyncHandler`
3. **Response format** — always use:
   ```typescript
   res.status(200).json({ success: true, data: { ... } })
   res.status(4xx).json({ success: false, message: "...", errors: [...] })
   ```
4. **Separation of concerns** — routes → controller → service → DB
5. **Constants** — store all strings in `src/packages/constants/`
6. **Never expose** `passwordHash`, `refreshToken`, or OTP codes in API responses
7. **Logging** — use `console.log` with structured format for now; tag with `[MODULE]`
8. **Pagination** — all list endpoints support `?page=1&limit=20`

---

## 🚦 Implementation Priority Order

1. ✅ Prisma schema + migrations
2. ✅ Redis + RabbitMQ config
3. ✅ Auth module (signup → OTP → login → reset password)
4. ✅ WebSocket server setup + authentication
5. ✅ Chat module (conversations + messages REST)
6. ✅ WebSocket real-time events (messaging + presence + typing)
7. ✅ WebRTC signaling (call offer/answer/ICE)
8. ✅ User module (profile + search)
9. ✅ File upload middleware
10. ✅ RabbitMQ consumers

---

## 🔍 Key Behaviours to Implement Precisely

### Last Seen
- Update `user.lastSeen` on every WebSocket disconnect
- Update `user.lastSeen` on logout API call
- Expose `lastSeen` in `GET /api/user/:userId` and conversation participant list

### Message Delivery Acknowledgement
- When recipient WebSocket connects and fetches messages → emit `MESSAGE_DELIVERED`
- When recipient opens conversation → emit `MESSAGE_READ` with timestamp
- Store in `MessageReadReceipt` table
- `deliveredAt` and `readAt` set on `Message` record for 1-on-1 chats

### Typing Indicators
- Use Redis TTL (5s) for typing state — auto-clears if client disconnects
- Client must continuously emit `TYPING_START` while typing (every 3s)
- Server emits `TYPING_STOP` when Redis key expires or client sends stop event

### WebRTC Call Signaling
- Generate `callId` as UUID on `CALL_OFFER`
- Store call state in Redis with 60s TTL
- If callee doesn't respond in 60s → auto-emit `CALL_END` with reason `TIMEOUT`
- Support ICE candidate buffering if answer not received yet