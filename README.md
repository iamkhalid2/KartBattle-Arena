# KartBattle Arena

A lightweight, browser-based multiplayer battle car game where players drive vehicles, collect weapons, and eliminate opponents in fast-paced arena matches.

## 🎮 Game Overview

**KartBattle Arena** is a multiplayer battle car game focused on quick matches and easy setup. Players enter rooms with a simple code, drive customizable vehicles, collect mystery boxes for weapons, and battle until only one remains.

## 1️⃣ Game Architecture (Minimal & Optimized)

### Frontend (Three.js + WebSockets)
- Players can **create** or **join** a room by entering a **6-digit code**
- Players input only their **name** before entering
- Game logic (movement, shooting, health, physics) runs primarily **client-side**
- WebSockets handle **state synchronization** with the server

### Backend (Lightweight Game Server)
- **Colyseus (Recommended) or Socket.io** → WebSocket-based room management
- **Google Cloud Run (Best for cost-efficiency) OR Compute Engine (Dedicated)** → Host the server
- **In-memory state (NO DB)** → Room states are stored **only in RAM** (Redis optional for multiple instances)
- **Auto-destroy empty rooms** → If no players remain in a room, it gets deleted

## 2️⃣ Game Flow

### 🔹 Room Creation & Joining
1. Player **clicks "Create Room"** → Server assigns a **random 6-digit code** and waits for players
2. Player **clicks "Join Room"** → They enter a code and their **name**, then the server checks if the room exists
3. Once all players join, **game starts** (host can optionally trigger it)

### 🔹 Gameplay (Core Mechanics)

#### Movement & Shooting
- Player movements (car controls) are handled **client-side** for responsiveness
- WebSocket messages sync position updates every **30ms (tickrate ~30Hz)**
- Shooting events trigger **server-side validation** before broadcasting to other players

#### Mystery Boxes & Weapons
- Boxes spawn randomly on the **server**
- When a player collects one, the server **assigns a random weapon** and **broadcasts** it
- Shooting events are processed on the **server first** before sending damage updates

#### Health & Death
- Server tracks each player's **health**
- When a player's HP reaches **0**, they are **removed from the game**
- The **last player standing wins**

#### Room Closure
- Once the game ends, the server **destroys the room** after a short delay

## 3️⃣ Best Hosting Strategy (Fast & Cost-Efficient)

| Component | Tech |
|-----------|------|
| **Game Server** | **Node.js + Colyseus (or Socket.io)**, hosted on **Google Cloud Run** (best for auto-scaling) OR **Compute Engine** (for more control) |
| **Frontend Hosting** | Firebase Hosting (Fast, free tier) OR Vercel (Easy) |
| **Database** | **None** (everything runs in-memory, no need for Firestore/SQL) |
| **Scaling** | Since player count is low (~10-15), a **single Google Cloud Run instance** should be enough. If scaling up, use **Redis for state sharing** |

## 4️⃣ Optimization Tips for a FAST Experience

✅ **Keep WebSocket messages small** → Send only deltas (changes in position, not full coordinates)  
✅ **Client-side interpolation & prediction** → Reduces lag for smooth movement  
✅ **Use Fixed Timesteps (`dt = 16ms`)** → Keeps physics & movement consistent  
✅ **Destroy inactive rooms quickly** → Saves memory  
✅ **Use MessagePack or CBOR (not JSON)** → Smaller data packets = less latency  

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/kartbattle-arena.git
cd kartbattle-arena
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

## 📝 Contributing
We welcome contributions to KartBattle Arena! Please open an issue or pull request.

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.