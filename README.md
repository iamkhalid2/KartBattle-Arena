# KartBattle Arena

A high-performance 3D kart racing game built with Three.js, TypeScript, and Vite. Race through a dynamic battle arena, avoid hazards, and collect power-ups!

## 🎮 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:5173` and start racing!

## 🎯 Controls

### Desktop
- **↑ / W** - Accelerate
- **↓ / S** - Brake / Reverse
- **← / A** - Turn Left
- **→ / D** - Turn Right  
- **R** - Restart Game (after game over)

### Mobile
Touch controls appear automatically:
- **Left side** - Gas & Brake pedals
- **Right side** - Steering joystick
- **Fullscreen button** - Top right corner

## 🏗️ Architecture

```
src/
├── core/           # Game orchestration & rendering
│   └── Game.ts     # Main game loop, camera, renderer
├── entities/       # Game objects
│   └── Car.ts      # Player car with physics
├── world/          # Environment systems
│   ├── managers/   # Specialized world managers
│   │   ├── ArenaManager.ts
│   │   ├── HazardManager.ts
│   │   ├── ItemManager.ts
│   │   ├── LightingManager.ts
│   │   └── SpawnManager.ts
│   ├── World.ts
│   ├── TerrainManager.ts
│   └── SkyboxManager.ts
├── utils/          # Utilities & helpers
│   ├── InputManager.ts
│   └── Logger.ts
└── config/         # Configuration
    └── constants.ts
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## 🚀 Building for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Three.js](https://threejs.org/)** - 3D rendering engine
- **[Vitest](https://vitest.dev/)** - Unit testing framework

## 🎨 Features

- ✅ Smooth 60 FPS physics with fixed timestep
- ✅ Dynamic arena with hazards and obstacles
- ✅ Mobile-first responsive design
- ✅ WebGL detection & graceful error handling
- ✅ Environment-based configuration (.env support)
- ✅ Performance monitoring (dev only)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please ensure:
- Tests pass (`npm test`)
- Build succeeds (`npm run build`)
- Code follows existing style
