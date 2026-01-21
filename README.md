```md
# ♟️ Chess Multiplayer Frontend

A production-ready real-time chess frontend built with **Next.js**, **Zustand**, and **Socket.IO**, supporting full chess rules, matchmaking, user accounts, clocks, spectators, reconnection, and server-authoritative gameplay.

---

## 🚀 Features (Completed)

### 🎮 Chess Mechanics
- Full chess piece movement logic
- Legal move validation
- King safety enforcement (cannot move into check)
- Check, Checkmate & Stalemate detection
- Castling (legal, no-through-check, no-exposing-king)
- Server-authoritative move enforcement
- Board orientation for white/black
- Piece selection & move UI

### 🌐 Multiplayer System
- Socket.IO real-time game sync
- Server-authoritative move updates
- No client-side cheating
- Automatic board updates for opponent
- Spectator mode (watch live games)
- Reconnection support (state recovery after refresh)
- Move replay from history (client-side deterministic)

### 🔍 Matchmaking
- Rating-based matchmaking (±100 Elo tolerance)
- Single timeout support (clean queue exit)
- Cancel matchmaking button
- Player-color assignment (white/black)
- Dynamic routing to `/game/[gameId]`

### ⏱ Clocks / Time Controls
- Server-owned chess clocks
- Client visual tick rendering
- Time increments per move supported
- Timeout → automatic win for opponent
- Refresh-safe clock state

### 👤 User System (Frontend Integration)
- OAuth & email login support ready
- JWT-based auth
- Access token used in socket authentication
- Profiles can display:
  - Name
  - Avatar
  - Rating
  - Match history

---

## 🧱 Tech Stack

- **Next.js (App Router)**
- **React 18**
- **Zustand** — Global game state
- **Socket.IO Client** — Real-time transport
- **Tailwind CSS** — UI styling
- **TypeScript**

---

## 🗂 Project Structure (Key Files)

src/
app/
play/ # matchmaking UI
game/[gameId]/ # active game page
spectate/[gameId]/ # spectator mode
components/
chess/ChessBoard.tsx # board UI only
store/
useGameStore.ts # client state + reconciliation
lib/
socket.ts # socket singleton
chess/ # (optional helpers)


---

## 🔌 WebSocket Messaging

### Client → Server
- `find_match`
- `cancel_matchmaking`
- `move` (move intent)
- `spectate`
- `reconnect`

### Server → Client
- `match_found`
- `match_cancelled`
- `match_timeout`
- `authoritative_move`
- `state_update`
- `timeout`
- `reconnected`

---

## ▶️ Running Locally

### Install Dependencies
```bash
npm install

### Start Development Server
```bash
npm run dev
```

### Env Variables
Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
