// BuildingManager.ts - Handles building generation and management
import * as THREE from 'three';

export class BuildingManager {
  private scene: THREE.Scene;
  private buildings: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public generateBuildings(chunkX: number, chunkZ: number, chunkSize: number): void {
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
        x = chunkX + Math.random() * chunkSize - chunkSize / 2;
        z = chunkZ + Math.random() * chunkSize - chunkSize / 2;
      } while (Math.abs(x - chunkX) < roadWidth || Math.abs(z - chunkZ) < roadWidth);
      
      this.createBuilding(x, z, width, height, depth);
    }
  }
  
  private createBuilding(x: number, z: number, width: number, height: number, depth: number): void {
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
    this.scene.add(building);
    
    // Add windows
    this.addWindowsToBuilding(building, width, height, depth);
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
  
  public checkCollisions(boundingBox: THREE.Box3): boolean {
    // Check collisions with buildings
    for (const building of this.buildings) {
      const buildingBoundingBox = new THREE.Box3().setFromObject(building);
      if (boundingBox.intersectsBox(buildingBoundingBox)) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }
  
  public reset(): void {
    // Remove all buildings from the scene
    this.buildings.forEach(building => {
      this.scene.remove(building);
    });
    this.buildings = [];
  }
}