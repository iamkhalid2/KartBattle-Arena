// Game.ts - Main game controller
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from '../world/World';
import { Car } from '../entities/Car';
import { InputManager } from '../utils/InputManager';
import { Logger } from '../utils/Logger';
import { GAME_CONFIG } from '../config/constants';

export class Game {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private world!: World;
  private car!: Car;
  private inputManager!: InputManager;
  private gameOver = false;
  private score = 0;
  private lastFrameTime: number = 0;
  private isMobile: boolean = false;

  // Performance optimization variables
  private stats!: Stats;
  private fixedTimeStep: number = GAME_CONFIG.FIXED_TIMESTEP;
  private maxSubSteps: number = GAME_CONFIG.MAX_SUBSTEPS;
  private accumulator: number = 0; // Time accumulator for fixed timestep
  private fpsElement: HTMLElement | null = null;

  constructor() {
    try {
      // Check WebGL support before initializing
      if (!this.checkWebGLSupport()) {
        throw new Error('WebGL is not supported in your browser. Please use a modern browser with WebGL support.');
      }

      // Set up scene
      this.scene = new THREE.Scene();

      // Set up camera with increased far plane to see the entire skybox
      this.camera = new THREE.PerspectiveCamera(
        GAME_CONFIG.CAMERA_FOV,
        window.innerWidth / window.innerHeight,
        GAME_CONFIG.CAMERA_NEAR,
        GAME_CONFIG.CAMERA_FAR
      );
      this.camera.position.set(0, 5, -10);
      this.camera.lookAt(0, 0, 10);

      // Set up renderer with improved performance optimizations
      this.renderer = new THREE.WebGLRenderer({
        antialias: GAME_CONFIG.ANTIALIAS_ENABLED,
        powerPreference: 'high-performance',
        precision: 'mediump' // Medium precision for better performance
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(GAME_CONFIG.PIXEL_RATIO);
      this.renderer.shadowMap.enabled = GAME_CONFIG.SHADOW_MAP_ENABLED;
      this.renderer.shadowMap.type = THREE.PCFShadowMap; // Better shadows without much performance cost
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMappingExposure = 1.0;
      this.renderer.autoClear = false; // For manual clearing - better performance
      document.body.appendChild(this.renderer.domElement);

      // Add stats for performance monitoring (development only)
      if (GAME_CONFIG.STATS_ENABLED) {
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom);
      } else {
        // Create a dummy stats object in production
        this.stats = { begin: () => { }, end: () => { }, dom: document.createElement('div') } as Stats;
      }

      // Create FPS display
      this.createFpsDisplay();

      // Handle window resize
      window.addEventListener('resize', () => this.onWindowResize());

      // Initialize input manager
      this.inputManager = new InputManager();
      this.isMobile = this.inputManager.isMobileDevice();

      // Create world
      this.world = new World(this.scene);

      // Create car
      this.car = new Car(this.scene, this.inputManager);

      // Set initial car position to a spawn point
      const spawnPoint = this.world.getRandomSpawnPoint();
      this.car.setPosition(spawnPoint);

      // Detect if we're on mobile and update instructions
      if (this.isMobile) {
        this.updateMobileInstructions();
      }

      // Start game loop
      this.lastFrameTime = performance.now();
      this.animate();

      Logger.info('Game initialized successfully');
    } catch (error) {
      Logger.error('Fatal error during game initialization:', error);
      this.handleFatalError(error as Error);
    }
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  private handleFatalError(error: Error): void {
    const errorElement = document.createElement('div');
    errorElement.id = 'fatal-error';
    errorElement.style.position = 'fixed';
    errorElement.style.top = '50%';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translate(-50%, -50%)';
    errorElement.style.maxWidth = '500px';
    errorElement.style.padding = '30px';
    errorElement.style.background = 'rgba(255, 0, 0, 0.95)';
    errorElement.style.color = 'white';
    errorElement.style.borderRadius = '10px';
    errorElement.style.textAlign = 'center';
    errorElement.style.zIndex = '9999';
    errorElement.style.fontFamily = 'Arial, sans-serif';
    errorElement.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';

    errorElement.innerHTML = `
      <h2 style="margin-top: 0;">⚠️ Unable to Start Game</h2>
      <p style="font-size: 16px; margin: 20px 0;">${error.message}</p>
      <p style="font-size: 14px; opacity: 0.9; margin-bottom: 0;">
        Please try:
        <br>• Using a modern browser (Chrome, Firefox, Edge)
        <br>• Enabling hardware acceleration in browser settings
        <br>• Updating your graphics drivers
      </p>
    `;

    document.body.appendChild(errorElement);
  }

  private createFpsDisplay(): void {
    this.fpsElement = document.createElement('div');
    this.fpsElement.id = 'fps';
    this.fpsElement.style.position = 'absolute';
    this.fpsElement.style.top = '10px';
    this.fpsElement.style.right = '10px';
    this.fpsElement.style.color = 'lime';
    this.fpsElement.style.fontSize = '16px';
    this.fpsElement.style.fontFamily = 'monospace';
    this.fpsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.fpsElement.style.padding = '5px';
    this.fpsElement.style.borderRadius = '3px';
    this.fpsElement.style.zIndex = '100';
    document.body.appendChild(this.fpsElement);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateMobileInstructions(): void {
    const instructions = document.getElementById('instructions');
    if (instructions) {
      // Remove the instructions div on mobile as we use on-screen controls instead
      instructions.style.display = 'none';
    }
  }

  private updateCamera(): void {
    // Position camera behind the car with some offset
    const carPosition = this.car.getPosition();
    const carDirection = this.car.getDirection();

    // Camera follows behind car at a distance and height
    const cameraOffset = new THREE.Vector3(
      -carDirection.x * 10, // Offset behind car based on its direction
      5, // Height
      -carDirection.z * 10 // Offset behind car based on its direction
    );

    this.camera.position.copy(carPosition).add(cameraOffset);
    this.camera.lookAt(
      carPosition.x + carDirection.x * 10,
      carPosition.y,
      carPosition.z + carDirection.z * 10
    );
  }

  private checkCollisions(): void {
    if (this.gameOver) return;

    if (this.world.checkCollisions(this.car)) {
      this.endGame();
    }

    // Update score based on distance traveled
    this.score = Math.floor(this.car.getDistanceTraveled());

    // Only update score display every 10 frames to reduce DOM operations
    if (this.score % 10 === 0) {
      this.updateScoreDisplay();
    }
  }

  private updateCarTerrainHeight(): void {
    // Get car position
    const carPosition = this.car.getPosition();

    // Get terrain height at car position
    const terrainHeight = this.world.getTerrainHeightAt(carPosition.x, carPosition.z);

    // Apply terrain height to car
    this.car.setTerrainHeight(terrainHeight);
  }

  private updateScoreDisplay(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `Score: ${this.score}`;
    }
  }

  private endGame(): void {
    this.gameOver = true;
    this.car.stop();

    // Show game over message
    this.showGameOverMessage();
  }

  private showGameOverMessage(): void {
    const gameOverElement = document.createElement('div');
    gameOverElement.id = 'gameOver';
    gameOverElement.style.position = 'absolute';
    gameOverElement.style.top = '50%';
    gameOverElement.style.left = '50%';
    gameOverElement.style.transform = 'translate(-50%, -50%)';
    gameOverElement.style.color = 'white';
    gameOverElement.style.fontSize = '32px';
    gameOverElement.style.fontFamily = 'Arial, sans-serif';
    gameOverElement.style.textAlign = 'center';
    gameOverElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    gameOverElement.style.padding = '20px';
    gameOverElement.style.borderRadius = '10px';
    gameOverElement.style.zIndex = '101';

    gameOverElement.innerHTML = `
      <h1>Game Over</h1>
      <p>Your Score: ${this.score}</p>
      <p>Press R to restart</p>
    `;

    document.body.appendChild(gameOverElement);
  }

  private restartGame(): void {
    this.gameOver = false;
    this.score = 0;

    // Reset the car first
    this.car.reset();

    // Reset world (ensure complete re-initialization)
    this.world.reset();

    // Important: Wait for all asynchronous tasks to complete
    // before continuing with the game setup
    setTimeout(() => {
      // Move car to a spawn point after world has reset
      const spawnPoint = this.world.getRandomSpawnPoint();
      this.car.setPosition(spawnPoint);

      // Clear the accumulator to prevent physics catching up
      this.accumulator = 0;

      // Update the last frame time to now
      this.lastFrameTime = performance.now();
    }, 100); // Small delay to ensure all async operations have completed

    // Remove game over message
    const gameOverElement = document.getElementById('gameOver');
    if (gameOverElement) {
      document.body.removeChild(gameOverElement);
    }
  }

  private updateFpsDisplay(fps: number): void {
    if (this.fpsElement) {
      this.fpsElement.textContent = `${Math.round(fps)} FPS`;

      // Color coding based on performance
      if (fps >= 55) {
        this.fpsElement.style.color = 'lime';
      } else if (fps >= 30) {
        this.fpsElement.style.color = 'yellow';
      } else {
        this.fpsElement.style.color = 'red';
      }
    }
  }

  private animate(): void {
    // Start stats measurement
    this.stats.begin();

    // Calculate delta time and handle frame timing
    const now = performance.now();
    let frameTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    // Cap maximum frame time to prevent spiral of death on slow devices
    if (frameTime > GAME_CONFIG.MAX_FRAME_TIME) frameTime = GAME_CONFIG.MAX_FRAME_TIME;

    // Accumulate time since last frame
    this.accumulator += frameTime;

    // Fixed timestep updates - limit physics steps for better performance
    const maxSteps = this.maxSubSteps;
    let steps = 0;

    while (this.accumulator >= this.fixedTimeStep && !this.gameOver && steps < maxSteps) {
      // Physics and gameplay updates at fixed intervals
      this.car.update(this.fixedTimeStep);
      this.updateCarTerrainHeight();
      this.world.update(this.fixedTimeStep);

      this.accumulator -= this.fixedTimeStep;
      steps++;
    }

    // If we're still behind and hit our max steps, discard remaining time
    // to prevent spiral of death
    if (steps >= maxSteps && this.accumulator > this.fixedTimeStep) {
      this.accumulator = 0;
    }

    // Non-physics updates (can run at variable framerate)
    if (!this.gameOver) {
      // Update skybox position to follow player but skip other updates
      this.world.updatePlayerPosition(this.car.getPosition());

      // Update camera position
      this.updateCamera();

      // Check for collisions
      this.checkCollisions();
    }

    // Handle restart input
    if (this.gameOver && !this.isMobile && this.inputManager.isKeyPressed('r')) {
      this.restartGame();
    }

    // Clear and render scene with proper depth sorting
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // Calculate and update FPS display (every 10 frames)
    if (Math.floor(now / 100) % 10 === 0) {
      const fps = 1 / frameTime;
      this.updateFpsDisplay(fps);
    }

    // End stats measurement
    this.stats.end();

    // Queue up next frame
    requestAnimationFrame(() => this.animate());
  }
}