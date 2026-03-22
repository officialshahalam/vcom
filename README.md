# VCOM — Chat & Video Calling App

A real-time chat and video calling app built with **React Native (Expo)**, **Node.js/Express**, **MongoDB**, **WebSocket**, and **RabbitMQ**.

```
vcom/
├── backend/   # Express REST API + WebSocket server
└── frontend/  # React Native (Expo) mobile app
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo) + NativeWind (Tailwind) |
| State | Zustand |
| Backend | Node.js + Express (modular) |
| Database | MongoDB (Mongoose) |
| Real-time | WebSocket (`ws`) |
| Message queue | RabbitMQ (`amqplib`) |
| Auth | JWT (bcryptjs) |

---

## Backend

### Setup

```bash
cd backend
cp .env.example .env        # fill in your values
npm install
npm run dev                 # nodemon
```

### Environment variables (`.env`)

| Key | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `MONGO_URI` | `mongodb://localhost:27017/vcom` | MongoDB connection string |
| `JWT_SECRET` | — | Secret for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `RABBITMQ_URL` | `amqp://localhost` | RabbitMQ connection string |
| `RABBITMQ_QUEUE` | `vcom_messages` | Queue name |

### Folder structure

```
backend/
├── server.js                  # Entry – HTTP + WebSocket + consumers
└── src/
    ├── app.js                 # Express app factory
    ├── config/
    │   ├── db.js              # MongoDB connection
    │   └── rabbitmq.js        # RabbitMQ connection + publish/consume helpers
    ├── modules/
    │   ├── auth/              # Register · Login · JWT
    │   ├── users/             # User listing + search
    │   └── messages/          # Send · Fetch · Mark-read
    ├── middleware/
    │   ├── auth.middleware.js # JWT protect guard
    │   └── error.middleware.js
    └── socket/
        └── socket.handler.js  # WebSocket: chat + WebRTC signaling
```

### REST API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Register |
| POST | `/api/auth/login` | – | Login |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/users` | ✓ | List / search users |
| GET | `/api/users/:id` | ✓ | Get user by id |
| POST | `/api/messages` | ✓ | Send message (HTTP fallback) |
| GET | `/api/messages/conversations` | ✓ | Conversation list |
| GET | `/api/messages/:partnerId` | ✓ | Fetch messages (paginated) |
| PATCH | `/api/messages/read/:senderId` | ✓ | Mark messages as read |

### WebSocket events (`ws://host/ws?token=JWT`)

**Client → Server**

| Type | Payload | Description |
|---|---|---|
| `chat:send` | `{ receiverId, content, messageType? }` | Send a message |
| `chat:typing` | `{ receiverId, isTyping }` | Typing indicator |
| `chat:read` | `{ senderId }` | Mark as read |
| `call:offer` | `{ receiverId, offer, callType }` | Initiate a call |
| `call:answer` | `{ callerId, answer }` | Accept a call |
| `call:ice-candidate` | `{ targetId, candidate }` | ICE candidate |
| `call:end` | `{ targetId }` | End call |
| `call:reject` | `{ callerId }` | Reject incoming call |

**Server → Client**

| Type | Description |
|---|---|
| `connected` | Handshake confirmation |
| `chat:receive` | Incoming message |
| `chat:typing` | Partner typing status |
| `chat:read` | Message read receipt |
| `call:incoming` | Incoming call with offer |
| `call:answer` | Call answer |
| `call:ice-candidate` | ICE candidate relay |
| `call:ended` | Remote ended the call |
| `call:rejected` | Remote rejected the call |

---

## Frontend

### Setup

```bash
cd frontend
npm install
npx expo start
```

### Folder structure

```
frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (main)/
│   │   ├── chat/
│   │   │   ├── index.tsx   # Conversation list
│   │   │   └── [id].tsx    # Chat room
│   │   ├── contacts/
│   │   │   └── index.tsx   # User search
│   │   └── calls/
│   │       └── index.tsx   # Active call UI
│   ├── _layout.tsx         # Root layout (auth guard + WS listeners)
│   └── index.tsx           # Redirect to login
├── store/
│   ├── auth.store.ts       # Zustand – auth
│   ├── chat.store.ts       # Zustand – messages / conversations
│   └── call.store.ts       # Zustand – call state
├── services/
│   ├── api.ts              # Typed fetch wrapper
│   └── socket.ts           # WebSocket client with auto-reconnect
└── constants/
    ├── api.ts              # API_BASE_URL / WS_URL (from env)
    └── theme.ts
```

Configure the backend URL via Expo's public env vars:

```bash
# .env (in frontend/)
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
EXPO_PUBLIC_WS_URL=ws://192.168.x.x:5000/ws
```
