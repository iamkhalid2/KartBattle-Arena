// World.ts - Handles world generation, terrain, obstacles and environment
import * as THREE from 'three';
import { Car } from '../entities/Car';

export class World {
  private scene: THREE.Scene;
  private terrain: THREE.Object3D;
  private obstacles: THREE.Mesh[] = [];
  private buildings: THREE.Mesh[] = [];
  private worldSize = 500; // Size of the open world
  private chunkSize = 100; // Size of each generated chunk
  private loadedChunks: Record<string, boolean> = {}; // Keep track of loaded chunks
  private visibleRadius = 200; // How far the player can see
  private skybox!: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.terrain = new THREE.Object3D();
    this.scene.add(this.terrain);
    
    // Initialize world
    this.createSkybox();
    this.createLights();
    this.createGround();
  }

  private createSkybox(): void {
    // Create a skybox using CubeTextureLoader with solid colors for each face
    const size = 2000;
    const skyGeometry = new THREE.BoxGeometry(size, size, size);
    
    // Create materials for each face of the cube
    const skyMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // right
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // left
      new THREE.MeshBasicMaterial({ color: 0x4CA3DD, side: THREE.BackSide }), // top (slightly darker blue)
      new THREE.MeshBasicMaterial({ color: 0x267F00, side: THREE.BackSide }), // bottom (green, matching ground)
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // front
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide })  // back
    ];
    
    // Create the skybox mesh with the materials array
    this.skybox = new THREE.Mesh(skyGeometry, skyMaterials);
    this.scene.add(this.skybox);
    
    // Add some clouds as geometry
    const cloudGeometry = new THREE.SphereGeometry(2, 8, 8);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 200; i++) {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        Math.random() * 1600 - 800,
        Math.random() * 100 + 100,
        Math.random() * 1600 - 800
      );
      cloud.scale.set(
        Math.random() * 5 + 2,
        0.5,
        Math.random() * 5 + 2
      );
      this.scene.add(cloud);
    }
  }

  private createLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    
    // Set up shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    
    this.scene.add(directionalLight);
  }

  private createGround(): void {
    // Base ground plane that covers the entire world
    const groundGeometry = new THREE.PlaneGeometry(this.worldSize * 2, this.worldSize * 2);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x267F00,
      roughness: 0.9
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    this.terrain.add(ground);
    
    // Initial road at the center
    this.generateChunk(0, 0);
  }

  private generateChunk(chunkX: number, chunkZ: number): void {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // Don't regenerate chunks we've already loaded
    if (this.loadedChunks[chunkKey]) return;
    
    // Mark this chunk as loaded
    this.loadedChunks[chunkKey] = true;
    
    const chunkCenterX = chunkX * this.chunkSize;
    const chunkCenterZ = chunkZ * this.chunkSize;
    
    // Generate roads for this chunk
    this.generateRoads(chunkCenterX, chunkCenterZ);
    
    // Generate buildings
    this.generateBuildings(chunkCenterX, chunkCenterZ);
    
    // Generate obstacles
    this.generateObstacles(chunkCenterX, chunkCenterZ);
  }
  
  private generateRoads(chunkX: number, chunkZ: number): void {
    const roadWidth = 10;
    
    // Create a horizontal road
    const horizontalRoadGeometry = new THREE.PlaneGeometry(this.chunkSize, roadWidth);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8 
    });
    
    const horizontalRoad = new THREE.Mesh(horizontalRoadGeometry, roadMaterial);
    horizontalRoad.rotation.x = -Math.PI / 2;
    horizontalRoad.position.set(chunkX, 0, chunkZ);
    this.terrain.add(horizontalRoad);
    
    // Create a vertical road that intersects the horizontal one
    const verticalRoadGeometry = new THREE.PlaneGeometry(roadWidth, this.chunkSize);
    const verticalRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    verticalRoad.rotation.x = -Math.PI / 2;
    verticalRoad.position.set(chunkX, 0, chunkZ);
    this.terrain.add(verticalRoad);
    
    // Add road markings - center white dashed lines
    const dashLength = 3;
    const dashGap = 3;
    const numDashes = Math.floor(this.chunkSize / (dashLength + dashGap));
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Horizontal road markings
    for (let i = 0; i < numDashes; i++) {
      const lineGeometry = new THREE.PlaneGeometry(dashLength, 0.3);
      const dash = new THREE.Mesh(lineGeometry, lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(
        chunkX - this.chunkSize/2 + i * (dashLength + dashGap) + dashLength/2,
        0.01, // Slightly above road
        chunkZ
      );
      this.terrain.add(dash);
    }
    
    // Vertical road markings
    for (let i = 0; i < numDashes; i++) {
      const lineGeometry = new THREE.PlaneGeometry(0.3, dashLength);
      const dash = new THREE.Mesh(lineGeometry, lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(
        chunkX,
        0.01, // Slightly above road
        chunkZ - this.chunkSize/2 + i * (dashLength + dashGap) + dashLength/2
      );
      this.terrain.add(dash);
    }
  }
  
  private generateBuildings(chunkX: number, chunkZ: number): void {
    // Only generate buildings away from the roads
    const roadWidth = 15; // Buffer around roads
    const buildingCount = Math.floor(Math.random() * 5) + 3; // 3-7 buildings per chunk
    
    for (let i = 0; i < buildingCount; i++) {
      // Random size for the building
      const width = Math.random() * 10 + 5;
      const height = Math.random() * 20 + 10;
      const depth = Math.random() * 10 + 5;
      
      // Random position within the chunk, but away from roads
      let x, z;
      do {
        x = chunkX + Math.random() * this.chunkSize - this.chunkSize / 2;
        z = chunkZ + Math.random() * this.chunkSize - this.chunkSize / 2;
      } while (Math.abs(x - chunkX) < roadWidth || Math.abs(z - chunkZ) < roadWidth);
      
      // Create building geometry
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          0.5 + Math.random() * 0.5, 
          0.5 + Math.random() * 0.5,
          0.5 + Math.random() * 0.5
        ),
        roughness: 0.7
      });
      
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(x, height / 2, z);
      this.buildings.push(building);
      this.terrain.add(building);
      
      // Add windows
      this.addWindowsToBuilding(building, width, height, depth);
    }
  }
  
  private addWindowsToBuilding(building: THREE.Mesh, width: number, height: number, depth: number): void {
    const windowRows = Math.floor(height / 3);
    const windowCols = Math.floor(width / 2);
    const windowDepthCols = Math.floor(depth / 2);
    
    const windowGeometry = new THREE.PlaneGeometry(1.2, 1.8);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x88CCFF,
      emissive: 0x88CCFF,
      emissiveIntensity: 0.2
    });
    
    // Front face windows
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(
          (col - windowCols / 2 + 0.5) * 2, 
          (row - windowRows / 2 + 0.5) * 2.5, 
          depth / 2 + 0.05
        );
        building.add(window);
      }
    }
    
    // Back face windows
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(
          (col - windowCols / 2 + 0.5) * 2, 
          (row - windowRows / 2 + 0.5) * 2.5, 
          -depth / 2 - 0.05
        );
        window.rotation.y = Math.PI;
        building.add(window);
      }
    }
    
    // Side face windows
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowDepthCols; col++) {
        // Left side
        const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        leftWindow.position.set(
          -width / 2 - 0.05, 
          (row - windowRows / 2 + 0.5) * 2.5, 
          (col - windowDepthCols / 2 + 0.5) * 2
        );
        leftWindow.rotation.y = Math.PI / 2;
        building.add(leftWindow);
        
        // Right side
        const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        rightWindow.position.set(
          width / 2 + 0.05, 
          (row - windowRows / 2 + 0.5) * 2.5, 
          (col - windowDepthCols / 2 + 0.5) * 2
        );
        rightWindow.rotation.y = -Math.PI / 2;
        building.add(rightWindow);
      }
    }
  }
  
  private generateObstacles(chunkX: number, chunkZ: number): void {
    const roadWidth = 15; // Buffer around roads
    const obstacleCount = Math.floor(Math.random() * 10) + 5; // 5-14 obstacles per chunk
    
    for (let i = 0; i < obstacleCount; i++) {
      // Random position within the chunk, but away from roads
      let x, z;
      do {
        x = chunkX + Math.random() * this.chunkSize - this.chunkSize / 2;
        z = chunkZ + Math.random() * this.chunkSize - this.chunkSize / 2;
      } while (Math.abs(x - chunkX) < roadWidth || Math.abs(z - chunkZ) < roadWidth);
      
      // 50% chance for a tree, 50% chance for another type of obstacle
      if (Math.random() > 0.5) {
        this.createTree(x, z);
      } else {
        this.createObstacle(x, z);
      }
    }
  }
  
  private createTree(x: number, z: number): void {
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 2, z);
    
    const leavesGeometry = new THREE.ConeGeometry(3, 6, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(0, 5, 0);
    
    trunk.add(leaves);
    this.obstacles.push(trunk);
    this.terrain.add(trunk);
  }
  
  private createObstacle(x: number, z: number): void {
    // Create various types of obstacles
    const obstacleTypes = [
      { geometry: new THREE.BoxGeometry(2, 1, 2), color: 0x8B8B8B, y: 0.5 }, // Rock
      { geometry: new THREE.CylinderGeometry(1, 1, 1.2, 16), color: 0xA9A9A9, y: 0.6 }, // Barrel
      { geometry: new THREE.TetrahedronGeometry(1.5), color: 0x696969, y: 0.8 } // Rubble
    ];
    
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: type.color });
    const obstacle = new THREE.Mesh(type.geometry, obstacleMaterial);
    
    obstacle.position.set(x, type.y, z);
    obstacle.rotation.y = Math.random() * Math.PI * 2;
    this.obstacles.push(obstacle);
    this.terrain.add(obstacle);
  }

  public update(playerPosition: THREE.Vector3): void {
    // Update skybox position to follow player
    this.skybox.position.copy(playerPosition);
    
    // Calculate which chunk the player is in
    const chunkX = Math.round(playerPosition.x / this.chunkSize);
    const chunkZ = Math.round(playerPosition.z / this.chunkSize);
    
    // Load chunks around the player in a 3x3 grid
    for (let x = chunkX - 1; x <= chunkX + 1; x++) {
      for (let z = chunkZ - 1; z <= chunkZ + 1; z++) {
        this.generateChunk(x, z);
      }
    }
  }
  
  public checkCollisions(car: Car): boolean {
    const carBoundingBox = car.getCollider();
    
    // Check collisions with obstacles
    for (const obstacle of this.obstacles) {
      const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);
      if (carBoundingBox.intersectsBox(obstacleBoundingBox)) {
        return true; // Collision detected
      }
    }
    
    // Check collisions with buildings
    for (const building of this.buildings) {
      const buildingBoundingBox = new THREE.Box3().setFromObject(building);
      if (carBoundingBox.intersectsBox(buildingBoundingBox)) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }
  
  public reset(): void {
    // Clear all existing obstacles and buildings
    this.obstacles.forEach(obstacle => {
      this.terrain.remove(obstacle);
    });
    
    this.buildings.forEach(building => {
      this.terrain.remove(building);
    });
    
    this.obstacles = [];
    this.buildings = [];
    this.loadedChunks = {};
    
    // Regenerate initial chunk
    this.generateChunk(0, 0);
  }
}