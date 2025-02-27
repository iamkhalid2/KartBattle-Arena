// Game.ts - Main game class that coordinates everything
import * as THREE from 'three';
import { Car } from '../entities/Car';
import { World } from '../world/World';
import { InputManager } from '../utils/InputManager';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world!: World;
  private car!: Car;
  private inputManager: InputManager;
  private gameOver = false;
  private score = 0;
  private lastFrameTime: number = 0;
  private isMobile: boolean = false;

  constructor() {
    // Set up scene
    this.scene = new THREE.Scene();
    
    // Set up camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1,
      3000 // Increased far clipping plane to accommodate the skybox
    );
    this.camera.position.set(0, 5, -10);
    this.camera.lookAt(0, 0, 10);
    
    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Initialize input manager
    this.inputManager = new InputManager();
    this.isMobile = this.inputManager.isMobileDevice();
    
    // Create world
    this.world = new World(this.scene);
    
    // Create car
    this.car = new Car(this.scene, this.inputManager);
    
    // Update instructions for mobile
    if (this.isMobile) {
      this.updateMobileInstructions();
    }
    
    // Start game loop
    this.animate();
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
    this.updateScoreDisplay();
  }
  
  private updateScoreDisplay(): void {
    let scoreElement = document.getElementById('score');
    
    if (!scoreElement) {
      scoreElement = document.createElement('div');
      scoreElement.id = 'score';
      scoreElement.style.position = 'absolute';
      scoreElement.style.top = '20px';
      scoreElement.style.left = '20px';
      scoreElement.style.color = 'white';
      scoreElement.style.fontSize = '24px';
      scoreElement.style.fontFamily = 'Arial, sans-serif';
      scoreElement.style.zIndex = '100';
      document.body.appendChild(scoreElement);
    }
    
    scoreElement.textContent = `Score: ${this.score}`;
  }
  
  private endGame(): void {
    this.gameOver = true;
    this.car.stop();
    this.showGameOverMessage();
  }
  
  private showGameOverMessage(): void {
    let gameOverElement = document.createElement('div');
    gameOverElement.id = 'gameOver';
    gameOverElement.style.position = 'absolute';
    gameOverElement.style.top = '50%';
    gameOverElement.style.left = '50%';
    gameOverElement.style.transform = 'translate(-50%, -50%)';
    gameOverElement.style.color = 'white';
    gameOverElement.style.fontSize = '36px';
    gameOverElement.style.fontFamily = 'Arial, sans-serif';
    gameOverElement.style.textAlign = 'center';
    gameOverElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    gameOverElement.style.padding = '20px';
    gameOverElement.style.borderRadius = '10px';
    gameOverElement.style.zIndex = '999';

    if (this.isMobile) {
      gameOverElement.innerHTML = `
        <h1>Game Over</h1>
        <p>Your score: ${this.score}</p>
        <div id="restart-button" style="
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
          border-radius: 5px;
        ">Restart Game</div>
      `;
      document.body.appendChild(gameOverElement);
      
      // Add touch event listener to restart button
      const restartButton = document.getElementById('restart-button');
      if (restartButton) {
        restartButton.addEventListener('touchstart', () => this.restartGame());
      }
    } else {
      gameOverElement.innerHTML = `
        <h1>Game Over</h1>
        <p>Your score: ${this.score}</p>
        <p>Press 'R' to restart</p>
      `;
      document.body.appendChild(gameOverElement);
    }
  }
  
  private restartGame(): void {
    this.gameOver = false;
    this.score = 0;
    this.car.reset();
    
    // Remove game over message
    const gameOverElement = document.getElementById('gameOver');
    if (gameOverElement) {
      document.body.removeChild(gameOverElement);
    }
    
    // Reset obstacles
    this.world.reset();
  }
  
  private animate(): void {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    requestAnimationFrame(() => this.animate());
    
    if (!this.gameOver) {
      // Update game state
      this.car.update();
      this.world.update(deltaTime);
      this.updateCamera();
      this.checkCollisions();
    }
    
    // Handle restart input
    if (this.gameOver && !this.isMobile && this.inputManager.isKeyPressed('r')) {
      this.restartGame();
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}