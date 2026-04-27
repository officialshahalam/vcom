# Agent.frontend.md — Frontend Development Agent Prompt

## 🧠 Role & Context

You are a senior React Native engineer building the **"Us"** chat and video calling app. The project is already scaffolded with **Expo**, **NativeWind (Tailwind CSS)**, and **TypeScript**. Your job is to implement all screens, components, navigation, real-time features, and WebRTC video calling based on the design files and specifications below.

---

## 🗂️ Project Structure

```
frontend/
├── assets/
│   ├── designs/          # ⭐ ALL DESIGN REFERENCE IMAGES ARE HERE — check before building any screen
│   ├── expo.icon/
│   └── images/
├── src/
│   ├── app/              # Expo Router file-based routing
│   │   └── _layout.tsx   # Root layout (navigation setup)
│   ├── constants/        # Colors, fonts, API URLs, WS events
│   ├── hooks/            # Custom hooks (useAuth, useChat, useWebSocket, useWebRTC)
│   ├── services/         # API service functions (axios instances)
│   ├── stores/           # Zustand global state stores
│   └── types/            # TypeScript type definitions
├── global.css            # NativeWind global styles
├── tailwind.config.js    # Tailwind configuration
├── app.json
├── babel.config.js
├── metro.config.js
├── nativewind-env.d.ts
└── tsconfig.json
```

---

## 🛠️ Tech Stack

- **Framework**: React Native + Expo (SDK 51+)
- **Router**: Expo Router (file-based)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API or `react-native-websocket`
- **WebRTC**: `react-native-webrtc`
- **Forms**: React Hook Form + Zod validation
- **Storage**: `expo-secure-store` (tokens), `@react-native-async-storage/async-storage`
- **Media**: `expo-image-picker`, `expo-camera`
- **Notifications**: `expo-notifications`
- **Icons**: `@expo/vector-icons` (Ionicons, MaterialCommunityIcons)
- **Animations**: `react-native-reanimated` v3

---

## 🎨 Design Reference

> **IMPORTANT**: Before building any screen, always look at the corresponding design file in `frontend/assets/designs/`.

### Design System — Extracted from Screenshots

**Color Palette**
```
Background:       #000000 (pure black)
Surface:          #1C1C1E (dark cards/inputs)
Surface Elevated: #2C2C2E (slightly lighter surfaces)
Border:           #3A3A3C
Primary (Blue):   #007AFF (iOS blue — used for CTA buttons, links)
Primary (Coral):  #FF6B6B → #FF4757 (login CTA gradient)
Text Primary:     #FFFFFF
Text Secondary:   #EBEBF5 at 60% opacity → #8E8E93
Green Online:     #34C759
Unread Badge:     #007AFF
```

**Typography**
```
App Name / Hero:   font-bold text-4xl   (e.g. "Welcome Back")
Section Title:     font-bold text-2xl   (e.g. "Create Account")
Body:              font-normal text-base
Label / Caption:   text-sm text-gray-400
Input placeholder: text-gray-500
```

**Input Style** (from design)
```
bg-[#1C1C1E] rounded-2xl px-4 py-4
border border-[#3A3A3C]
text-white placeholder-gray-500
flex-row items-center gap-3
```

**Primary Button (Blue)**
```
bg-[#007AFF] rounded-full py-4
text-white font-semibold text-base text-center
```

**Primary Button (Coral — Login screen)**
```
bg-gradient from #FF6B6B to #FF4757 (use expo-linear-gradient)
rounded-full py-4
text-white font-semibold
```

**Bottom Tab Bar**
```
bg-black border-t border-[#1C1C1E]
3 tabs: Heart (Home), Chat bubble (Chat), Person (Profile)
Active: white icon, Inactive: gray icon
Chat tab shows unread badge
```

---

## 📁 File-Based Routing Structure (`src/app/`)

```
src/app/
├── _layout.tsx                    # Root layout: auth check, navigation setup
├── index.tsx                      # Redirect based on auth state
│
├── (auth)/
│   ├── _layout.tsx                # Auth stack layout (no tab bar)
│   ├── login.tsx                  # Login screen
│   ├── signup.tsx                 # Sign Up screen
│   ├── verify-otp.tsx             # OTP Verification screen
│   ├── forgot-password.tsx        # Forgot Password (enter mobile)
│   └── reset-password.tsx         # Create New Password screen
│
├── (tabs)/
│   ├── _layout.tsx                # Bottom tab navigator
│   ├── home.tsx                   # Home tab (full-screen photo)
│   ├── chat/
│   │   ├── index.tsx              # Chat list screen
│   │   └── [conversationId].tsx   # Chat conversation screen
│   └── profile.tsx                # Profile screen
│
└── call/
    └── [callId].tsx               # Full-screen video call screen
```

---

## 🔐 Auth Screens

### `(auth)/login.tsx`
**Design ref**: `assets/designs/login.png`

Layout (black background, centered):
- App logo (rounded square, gradient icon) — top center
- "Welcome Back" — text-4xl font-bold text-white
- "Please sign in to your account." — text-sm text-gray-400
- Input: mobile phone icon + "Mobile Number" — numeric keyboard
- Input: lock icon + "Password" — secure text entry
- "Forgot Password?" — right-aligned, text-white text-sm
- Coral gradient CTA button: "Login"
- Divider: "or continue with"
- Google button: dark surface, Google logo SVG, "Google" text
- "Don't have an account? **Sign Up**" — bottom link

**Behaviour**:
- Form validation via React Hook Form + Zod
- On submit: call `POST /api/auth/login`
- On success: save tokens to SecureStore, navigate to `/(tabs)/home`
- On error: show inline error below input fields
- Show loading spinner inside button during request

---

### `(auth)/signup.tsx`
**Design ref**: `assets/designs/signup.png`

Layout:
- "Create Account" — text-2xl font-bold text-white, top
- Input fields (dark rounded): Full Name, Username (@icon), Mobile Number, Password, Confirm Password
- "Sign Up" blue button
- "Already have an account? **Log In**" — bottom

**Behaviour**:
- Validate: fullName (required), username (alphanumeric, 3-20 chars), mobileNumber (valid format), password (min 8 chars, 1 upper, 1 number), confirmPassword (match)
- On submit: call `POST /api/auth/signup`
- On success: navigate to `/(auth)/verify-otp` passing `userId` as param

---

### `(auth)/verify-otp.tsx`
**Design ref**: `assets/designs/verify-otp.png`

Layout:
- "Verify OTP" — font-bold text-2xl
- Subtitle: "Enter the 4-digit code sent to your mobile."
- 4 large OTP input boxes (dark rounded squares, auto-advance on digit entry)
- "Edit Mobile" button — gray pill button
- "Resend Code in MM:SS" countdown (60 seconds)
- "Verify" blue button — full width bottom

**Behaviour**:
- Auto-focus first box; auto-advance to next box on digit entry
- On backspace in empty box: focus previous box
- Countdown timer: when reaches 0, show "Resend Code" tappable link
- On verify: call `POST /api/auth/verify-otp` with `{ userId, otp }`
- On success: navigate to `/(tabs)/home`
- OTP type: SIGNUP or RESET_PASSWORD (passed as route param)
- If RESET_PASSWORD: navigate to `/(auth)/reset-password`

---

### `(auth)/reset-password.tsx`
**Design ref**: `assets/designs/reset-password.png`

Layout:
- "Create New Password" — font-bold text-2xl
- Subtitle about password requirements
- "New Password" input with password strength bar:
  - 3 segment bar: red | orange | green
  - Label: "Password Strength: Weak / Medium / Strong"
- "Confirm Password" input
- "Both passwords must match" — error hint text below
- "Reset Password" blue button

**Password Strength Logic**:
```typescript
function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 'weak';
  if (score <= 2) return 'medium';
  return 'strong';
}
```

**Behaviour**:
- On submit: call `POST /api/auth/reset-password`
- On success: navigate to login with success toast

---

## 🏠 Tab Screens

### `(tabs)/home.tsx`
**Design ref**: `assets/designs/home.png`

Layout:
- Full-screen, black background
- Single large illustration/avatar image fills most of the screen (from `assets/images/`)
- No content overlay — pure photo/image display
- Bottom tab bar visible

---

### `(tabs)/chat/index.tsx` — Chat List
**Design ref**: `assets/designs/chat-list.png`

Layout:
- Header: "**Us** ▾" left (bold, dropdown arrow), compose icon right (pencil square)
- Search bar: `bg-[#1C1C1E] rounded-xl` with search icon
- Conversation list (FlatList):
  - Avatar (circular, 56px) with colored ring if active story
  - Green dot overlay on avatar if user is online
  - Name (font-semibold text-white)
  - Last message preview (text-gray-400) — prefix "You: " if sent by current user
  - Timestamp (right-aligned, text-gray-500)
  - Unread badge: blue circle with count (if unread > 0) OR blue dot (if 1 unread)
- Bottom tab bar

**Behaviour**:
- Load conversations from `GET /api/chat/conversations`
- Subscribe to WebSocket events: `NEW_MESSAGE`, `MESSAGE_READ`, `USER_ONLINE`
- Update conversation list in real-time
- Tap conversation → navigate to `/(tabs)/chat/[conversationId]`
- Search filters conversation list by name (local filter)
- Pull-to-refresh

---

### `(tabs)/chat/[conversationId].tsx` — Chat Conversation
**Design ref**: `assets/designs/chat-conversation.png`

**Header**:
- Back arrow (left)
- Avatar (40px) + Name + "Active now" / "Last seen {time}" status
- Phone icon (audio call) + Video camera icon + Info icon (right)

**Message Bubbles**:
- Received: `bg-[#1C1C1E]` dark gray, left-aligned, small avatar below last message in group
- Sent: `bg-[#007AFF]` blue, right-aligned
- Image messages: rounded image (300px wide), tap to view full screen
- Date separators: centered gray label (e.g. "TODAY", "WEDNESDAY, 8:40 PM")
- Read receipts: small circle icon below sent message (empty = sent, filled = read)

**Input Bar** (bottom):
- `bg-[#1C1C1E]` rounded-full
- Emoji icon (left)
- "Message..." placeholder text input
- Mic icon (right) — for audio
- Image icon (right) — for media picker
- Send icon (arrow up in circle) — appears when text is entered

**Behaviour**:
- Load messages `GET /api/chat/conversations/:id/messages` (paginated, infinite scroll up)
- Send message `POST /api/chat/conversations/:id/messages`
- WebSocket events: `NEW_MESSAGE`, `MESSAGE_DELIVERED`, `MESSAGE_READ`, `TYPING_START`, `TYPING_STOP`
- Emit `TYPING_START` on text input change (debounced 3s)
- Emit `MESSAGE_READ` when screen is focused and new messages present
- Show typing indicator: animated 3-dot bubble where avatar would be
- Image picker: `expo-image-picker` → upload → send as IMAGE message type
- Auto-scroll to bottom on new message
- Tap video icon → initiate WebRTC call → navigate to `/call/[callId]`
- **Last Seen Display**: "Last seen today at 3:42 PM" / "Last seen yesterday" / "Active now"
- **Message Status Icons**:
  - ⏱ = Sending
  - ✓ (single gray) = Sent/Delivered
  - ✓✓ (double blue) = Read

---

### `(tabs)/profile.tsx` — Profile Screen
**Design ref**: `assets/designs/profile.png`

Layout (black background):
- Top bar: lock icon + username (bold, left), `[+]` button + hamburger menu (right)
- Large circular avatar (120px) with thick black border ring — center
- Display name (bold text-xl white) — below avatar
- Bio text (text-sm text-gray-300 text-center) — 2 lines max
- Link/URL text (text-gray-400)
- 3 action buttons row:
  - "Edit Profile" — dark pill button
  - "Share Profile" — dark pill button
  - `+👤` icon button — dark square pill
- Bottom tab bar

**Behaviour**:
- Load from store (`useAuthStore` / profile state)
- "Edit Profile" → modal or push screen with editable fields
- "Share Profile" → `Share.share()` with profile link
- Hamburger → settings menu (logout option)
- Profile picture tap → `expo-image-picker` → upload to `POST /api/user/profile/picture`

---

## 📹 Video Call Screen (`call/[callId].tsx`)
**Design ref**: `assets/designs/video-call.png` *(if present)*

### Layout
```
Full-screen black background
│
├── Remote video (top half, 50% height)
│   └── RTCView — remote stream (object-fit: cover)
│
├── Local video (bottom half, 50% height)  
│   └── RTCView — local stream (object-fit: cover)
│
├── TOP OVERLAY (absolute)
│   ├── Back/minimize button (top-left)
│   └── Caller name + call duration timer (top-center)
│
└── BOTTOM CONTROLS BAR (absolute, bottom 40px)
    ├── 🔇 Mute/Unmute button (toggle mic)
    ├── 📵 End Call button (red circle, center)
    ├── 🎭 Face Filter button (toggle filters like Instagram)
    ├── 📷 Flip camera button
    └── 🔈 Speaker toggle
```

### Face Filter Feature
```typescript
// Implement basic face filters using expo-camera or react-native-vision-camera
// Filters: Normal | Blur Background | Grayscale | Warm | Cool | Beauty
// Use a horizontal scrollable filter picker above the controls bar
// Apply filter using canvas-style manipulation or shader (expo-gl if needed)
// Minimum: show filter selection UI + blur background filter
```

### WebRTC Implementation

```typescript
// hooks/useWebRTC.ts

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  RTCView,
} from 'react-native-webrtc';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// useWebRTC hook must handle:
// 1. getUserMedia (video + audio)
// 2. Create RTCPeerConnection
// 3. Add local stream tracks to connection
// 4. Handle onicecandidate → send via WebSocket CALL_ICE_CANDIDATE
// 5. Handle ontrack → set remote stream
// 6. Caller: createOffer → setLocalDescription → send CALL_OFFER
// 7. Callee: setRemoteDescription(offer) → createAnswer → setLocalDescription → send CALL_ANSWER
// 8. Both: apply received ICE candidates via addIceCandidate
// 9. Mute: localStream.getAudioTracks()[0].enabled = false
// 10. Camera flip: cycle through front/back using mediaDevices.enumerateDevices()
// 11. End call: close peerConnection, stop all tracks, emit CALL_END
```

### Call Flow

**Outgoing Call** (initiated from chat header video icon):
1. Navigate to `/call/new?toUserId=XXX`
2. Get local media stream
3. Create peer connection
4. Send `CALL_OFFER` via WebSocket
5. Show "Calling..." state with callee avatar (full screen)
6. On `CALL_ANSWER`: set remote description, show video UI
7. On `CALL_END` / `CALL_REJECTED`: cleanup + navigate back

**Incoming Call** (received via WebSocket `CALL_OFFER`):
1. Show incoming call modal overlay (anywhere in app)
2. Display: caller avatar, name, "Video Call", Accept (green) / Decline (red) buttons
3. On accept: navigate to `/call/[callId]`, send `CALL_ANSWER`
4. On decline: send `CALL_REJECT`, dismiss modal

---

## 🗃️ State Management (`src/stores/`)

### `authStore.ts` (Zustand)
```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (credentials: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  verifyOtp: (data: VerifyOtpInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}
```

### `chatStore.ts` (Zustand)
```typescript
interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;   // conversationId → messages
  typingUsers: Record<string, string[]>; // conversationId → [userId]
  unreadCounts: Record<string, number>;
  
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: MessageType) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  
  // WebSocket handlers
  onNewMessage: (message: Message) => void;
  onMessageDelivered: (data: DeliveryAck) => void;
  onMessageRead: (data: ReadAck) => void;
  onTypingStart: (data: TypingEvent) => void;
  onTypingStop: (data: TypingEvent) => void;
  onUserPresenceUpdate: (data: PresenceUpdate) => void;
}
```

### `webSocketStore.ts` (Zustand)
```typescript
interface WebSocketStore {
  socket: WebSocket | null;
  isConnected: boolean;
  
  connect: (token: string) => void;
  disconnect: () => void;
  send: (type: string, payload: object) => void;
}
```

---

## 🌐 Services (`src/services/`)

### `api.ts` — Axios Instance
```typescript
// Base URL from constants
// Request interceptor: attach Authorization: Bearer {accessToken}
// Response interceptor: on 401 → call refresh token → retry original request
// On refresh failure → logout user
```

### `authService.ts`
```typescript
export const authService = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  logout: () => api.post('/auth/logout'),
}
```

### `chatService.ts`
```typescript
export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (participantId) => api.post('/chat/conversations', { participantId }),
  getMessages: (conversationId, page) => api.get(`/chat/conversations/${conversationId}/messages?page=${page}`),
  sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
  markAsRead: (conversationId) => api.post(`/chat/conversations/${conversationId}/read`),
}
```

---

## 🔗 WebSocket Hook (`src/hooks/useWebSocket.ts`)

```typescript
// Singleton WebSocket connection
// Connect on app load if authenticated
// Reconnect with exponential backoff on disconnect
// Parse incoming JSON messages and dispatch to appropriate store handlers:
//   NEW_MESSAGE → chatStore.onNewMessage()
//   MESSAGE_READ → chatStore.onMessageRead()
//   TYPING_START → chatStore.onTypingStart()
//   USER_ONLINE → chatStore.onUserPresenceUpdate()
//   CALL_OFFER → show incoming call modal
//   CALL_ANSWER / CALL_ICE_CANDIDATE → useWebRTC hook handlers
// Send heartbeat every 20s (PING message)
```

---

## 🧩 Shared Components

### `components/ui/`
- `OtpInput.tsx` — 4-box OTP input with auto-advance
- `PasswordStrengthBar.tsx` — 3-segment colored bar
- `Avatar.tsx` — circular image with online dot, size prop
- `MessageBubble.tsx` — handles sent/received, media, read receipts
- `TypingIndicator.tsx` — animated 3-dot bubble
- `IncomingCallModal.tsx` — full-overlay incoming call sheet
- `FilterPicker.tsx` — horizontal scrollable face filter selector

### `components/chat/`
- `ConversationItem.tsx` — single row in chat list
- `MessageList.tsx` — FlatList with inverted scroll, pagination
- `ChatInput.tsx` — input bar with media/emoji/send
- `DateSeparator.tsx` — "TODAY", "WEDNESDAY, 8:40 PM"

---

## 📐 Code Standards

1. **NativeWind only** — no StyleSheet, no inline `style={{}}` unless strictly needed for dynamic values
2. **TypeScript strict** — no `any`, define all types in `src/types/`
3. **Expo Router** — use `Link`, `router.push()`, `useLocalSearchParams()` for navigation
4. **Zustand** — no prop drilling; access store directly in components
5. **Separation**: screens are thin orchestrators; logic lives in hooks/stores/services
6. **Platform guards** — use `Platform.OS` for iOS/Android differences
7. **Dark theme**: All screens are dark (`bg-black`) — do not add white backgrounds
8. **Keyboard handling**: Use `KeyboardAvoidingView` on all form screens

---

## 🚦 Implementation Priority Order

1. ✅ Navigation setup (`_layout.tsx`, route structure)
2. ✅ Auth store + SecureStore token persistence
3. ✅ Login screen
4. ✅ Signup screen
5. ✅ OTP verify screen
6. ✅ Reset password screens
7. ✅ Bottom tab navigator + Home + Profile screens
8. ✅ Chat list screen + API integration
9. ✅ Chat conversation screen + WebSocket messaging
10. ✅ Typing indicators + presence + read receipts
11. ✅ Image sharing in chat
12. ✅ WebRTC setup + outgoing call flow
13. ✅ Incoming call modal
14. ✅ Video call screen (split view, controls)
15. ✅ Face filter UI + blur background filter

---

## 🔍 Key Behaviours to Match Exactly (from Designs)

### Last Seen Format
```typescript
function formatLastSeen(lastSeen: Date, isOnline: boolean): string {
  if (isOnline) return 'Active now';
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `Active ${Math.floor(diff/60_000)}m ago`;
  if (diff < 86_400_000) return `Last seen today at ${format(lastSeen, 'h:mm a')}`;
  if (diff < 172_800_000) return `Last seen yesterday`;
  return `Last seen ${format(lastSeen, 'MMM d')}`;
}
```

### Message Timestamp (in conversation list)
```
< 1 hour:    "12m", "45m"
Same day:    "3:42 PM"
Yesterday:   "Yesterday"
Older:       "Mon", "Apr 2"
```

### Unread Badge Rules
- 1 unread → solid blue dot (no number)
- 2+ unread → blue circle with white number
- 0 unread → no badge shown

### Online Indicator
- Green dot (10px, white border) overlaid bottom-right of avatar
- Only shown if `user.isOnline === true`
- In chat header: show "Active now" text instead of dot

### Read Receipt Icons (in conversation)
- Message sending: single faint circle
- Sent & delivered: `✓` single check, gray
- Read: `✓✓` double check, blue (#007AFF)