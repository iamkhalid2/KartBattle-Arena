// main.ts - The entry point to the game
import { Game } from './core/Game';

// Start the game
function initGame(): void {
  const game = new Game();
  (window as any).gameInstance = game; // Store game instance on window
}

declare global {
  interface Window {
    gameInstance: Game;
  }
}

window.addEventListener('DOMContentLoaded', initGame);


