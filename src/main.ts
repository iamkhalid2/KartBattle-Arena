// main.ts
import * as THREE from 'three';

// Game variables
class CarGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private car!: THREE.Group;
  private road!: THREE.Mesh;
  private obstacles: THREE.Mesh[] = [];
  private lastTime = 0;
  private speed = 0;
  private maxSpeed = 0.5;
  private acceleration = 0.01;
  private deceleration = 0.005;
  private lateralSpeed = 0.1;
  private roadWidth = 10;
  private roadLength = 1000;
  private gameOver = false;
  private score = 0;
  private skybox!: THREE.Mesh;
  
  private keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  constructor() {
    // Set up scene
    this.scene = new THREE.Scene();
    
    // Set up camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 5, -10);
    this.camera.lookAt(0, 0, 10);
    
    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Set up controls
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Create game elements
    this.createSkybox();
    this.createLights();
    this.createRoad();
    this.createCar();
    this.createObstacles();
    
    // Start game loop
    this.animate(0);
  }

  private createSkybox(): void {
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyMaterials = Array(6).fill(null).map(() => 
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x87CEEB),
        side: THREE.BackSide
      })
    );
    
    // Add some clouds as geometry
    const cloudGeometry = new THREE.SphereGeometry(2, 8, 8);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 100; i++) {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        Math.random() * 800 - 400,
        Math.random() * 100 + 100,
        Math.random() * 800 - 400
      );
      cloud.scale.set(
        Math.random() * 2 + 1,
        0.3,
        Math.random() * 2 + 1
      );
      this.scene.add(cloud);
    }
    
    this.skybox = new THREE.Mesh(skyGeometry, skyMaterials);
    this.scene.add(this.skybox);
  }

  private createLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 0);
    this.scene.add(directionalLight);
  }

  private createRoad(): void {
    // Road
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.roadLength);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8
    });
    
    this.road = new THREE.Mesh(roadGeometry, roadMaterial);
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.set(0, -0.1, this.roadLength / 2);
    this.scene.add(this.road);
    
    // Dashed line markings
    const dashLength = 5;
    const dashGap = 5;
    const numDashes = Math.floor(this.roadLength / (dashLength + dashGap));
    
    for (let i = 0; i < numDashes; i++) {
      const lineGeometry = new THREE.PlaneGeometry(0.2, dashLength);
      const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dash = new THREE.Mesh(lineGeometry, lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(
        0,
        0,
        i * (dashLength + dashGap)
      );
      this.scene.add(dash);
    }
    
    // Side barriers
    const barrierGeometry = new THREE.BoxGeometry(0.5, 1, this.roadLength);
    const barrierMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.set(-this.roadWidth/2 - 0.25, 0.5, this.roadLength/2);
    this.scene.add(leftBarrier);
    
    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.set(this.roadWidth/2 + 0.25, 0.5, this.roadLength/2);
    this.scene.add(rightBarrier);
    
    // Add some grass on the sides
    const grassGeometry = new THREE.PlaneGeometry(50, this.roadLength);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x1E8449 });
    
    const leftGrass = new THREE.Mesh(grassGeometry, grassMaterial);
    leftGrass.rotation.x = -Math.PI / 2;
    leftGrass.position.set(-this.roadWidth / 2 - 25, -0.15, this.roadLength / 2);
    this.scene.add(leftGrass);
    
    const rightGrass = new THREE.Mesh(grassGeometry, grassMaterial);
    rightGrass.rotation.x = -Math.PI / 2;
    rightGrass.position.set(this.roadWidth / 2 + 25, -0.15, this.roadLength / 2);
    this.scene.add(rightGrass);
  }

  private createCar(): void {
    this.car = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 0.5;
    this.car.add(carBody);
    
    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.5, 0.7, 2);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xAA0000 });
    const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
    carRoof.position.set(0, 1.35, -0.5);
    this.car.add(carRoof);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const wheelPositions = [
      { x: -1.1, y: 0, z: 1.2 },
      { x: 1.1, y: 0, z: 1.2 },
      { x: -1.1, y: 0, z: -1.2 },
      { x: 1.1, y: 0, z: -1.2 }
    ];
    
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      this.car.add(wheel);
    });
    
    // Add car to scene
    this.car.position.set(0, 0, 0);
    this.scene.add(this.car);
  }

  private createObstacles(): void {
    const obstacleCount = 20;
    const obstacleGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x0000FF });
    
    for (let i = 0; i < obstacleCount; i++) {
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      
      // Random position on the road
      const x = Math.random() * this.roadWidth - this.roadWidth / 2;
      const z = 20 + Math.random() * (this.roadLength - 40);
      
      obstacle.position.set(x, 0.5, z);
      this.obstacles.push(obstacle);
      this.scene.add(obstacle);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'r':
        if (this.gameOver) this.restartGame();
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'ArrowRight':
        this.keys.right = false;
        break;
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateCarPosition(deltaTime: number): void {
    if (this.gameOver) return;
    
    // Handle acceleration and deceleration
    if (this.keys.forward) {
      this.speed += this.acceleration;
    } else if (this.keys.backward) {
      this.speed -= this.acceleration;
    } else {
      // Natural deceleration when no key is pressed
      if (this.speed > 0) {
        this.speed -= this.deceleration;
      } else if (this.speed < 0) {
        this.speed += this.deceleration;
      }
    }
    
    // Clamp speed
    this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));
    
    // Update car position based on speed
    this.car.position.z += this.speed;
    
    // Handle lateral movement (reversed the signs for correct direction)
    if (this.keys.left) {
      this.car.position.x += this.lateralSpeed; // Changed from -= to +=
    }
    if (this.keys.right) {
      this.car.position.x -= this.lateralSpeed; // Changed from += to -=
    }
    
    // Clamp car to road
    const halfRoadWidth = this.roadWidth / 2 - 1;
    this.car.position.x = Math.max(-halfRoadWidth, Math.min(halfRoadWidth, this.car.position.x));
    
    // Keep car in road boundaries
    this.car.position.z = Math.max(0, Math.min(this.roadLength - 4, this.car.position.z));
    
    // Update camera position to follow car
    this.camera.position.z = this.car.position.z - 10;
    this.camera.position.x = this.car.position.x * 0.5;
    this.camera.lookAt(this.car.position.x, 0, this.car.position.z + 10);
    
    // Update score based on distance traveled
    this.score = Math.floor(this.car.position.z);
    this.updateScoreDisplay();
  }

  private checkCollisions(): void {
    if (this.gameOver) return;
    
    const carBoundingBox = new THREE.Box3().setFromObject(this.car);
    
    for (const obstacle of this.obstacles) {
      const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);
      
      if (carBoundingBox.intersectsBox(obstacleBoundingBox)) {
        this.endGame();
        break;
      }
    }
  }

  private endGame(): void {
    this.gameOver = true;
    this.speed = 0;
    this.showGameOverMessage();
  }

  private restartGame(): void {
    this.gameOver = false;
    this.score = 0;
    this.car.position.set(0, 0, 0);
    this.speed = 0;
    
    // Remove game over message
    const gameOverElement = document.getElementById('gameOver');
    if (gameOverElement) {
      document.body.removeChild(gameOverElement);
    }
    
    // Reset obstacles
    this.obstacles.forEach(obstacle => {
      this.scene.remove(obstacle);
    });
    this.obstacles = [];
    this.createObstacles();
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
      document.body.appendChild(scoreElement);
    }
    
    scoreElement.textContent = `Score: ${this.score}`;
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
    gameOverElement.innerHTML = `
      <h1>Game Over</h1>
      <p>Your score: ${this.score}</p>
      <p>Press 'R' to restart</p>
    `;
    document.body.appendChild(gameOverElement);
  }

  private animate(time: number): void {
    requestAnimationFrame((t) => this.animate(t));
    
    // Update skybox position to follow camera
    if (this.skybox) {
      this.skybox.position.copy(this.camera.position);
    }
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    this.updateCarPosition(deltaTime);
    this.checkCollisions();
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the game
window.addEventListener('DOMContentLoaded', () => {
  const game = new CarGame();
});