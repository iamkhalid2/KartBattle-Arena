// ObstacleManager.ts - Handles obstacle generation and management
import * as THREE from 'three';

export class ObstacleManager {
  private scene: THREE.Scene;
  private obstacles: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public generateObstacles(chunkX: number, chunkZ: number, chunkSize: number): void {
    const roadWidth = 15; // Buffer around roads
    const obstacleCount = Math.floor(Math.random() * 10) + 5; // 5-14 obstacles per chunk
    
    for (let i = 0; i < obstacleCount; i++) {
      // Random position within the chunk, but away from roads
      let x, z;
      do {
        x = chunkX + Math.random() * chunkSize - chunkSize / 2;
        z = chunkZ + Math.random() * chunkSize - chunkSize / 2;
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
    this.scene.add(trunk);
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
    this.scene.add(obstacle);
  }
  
  public checkCollisions(boundingBox: THREE.Box3): boolean {
    // Check collisions with obstacles
    for (const obstacle of this.obstacles) {
      const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);
      if (boundingBox.intersectsBox(obstacleBoundingBox)) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }
  
  public update(deltaTime: number): void {
    // Update logic for obstacles - can be empty if no animation/movement is needed
  }
  
  public getEntitiesForMinimap(): any[] {
    // Return obstacle data for the minimap
    return this.obstacles.map(obstacle => {
      const position = obstacle.position.clone();
      return {
        type: 'obstacle',
        position: position,
        radius: 1 // General radius for obstacle representation on minimap
      };
    });
  }
  
  public reset(): void {
    // Remove all obstacles from the scene
    this.obstacles.forEach(obstacle => {
      this.scene.remove(obstacle);
    });
    this.obstacles = [];
  }
}