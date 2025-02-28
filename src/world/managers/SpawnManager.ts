import * as THREE from 'three';

export class SpawnManager {
  private scene: THREE.Scene;
  private arenaSize: number;
  private spawnPoints: THREE.Vector3[] = [];
  private spawnMarkers: THREE.Mesh[] = [];
  
  constructor(scene: THREE.Scene, arenaSize: number) {
    this.scene = scene;
    this.arenaSize = arenaSize;
  }
  
  public createSpawnPoints(): void {
    // Create spawn points for players around the arena
    const spawnCount = 8; // For up to 8 players
    
    for (let i = 0; i < spawnCount; i++) {
      const angle = (i / spawnCount) * Math.PI * 2;
      // Increase the distance from center to ensure we're away from slowing circles
      // Using 0.65 instead of 0.4 to place spawns closer to the edge and away from hazards
      const distanceFromCenter = this.arenaSize * 0.65; 
      
      const x = Math.cos(angle) * distanceFromCenter;
      const z = Math.sin(angle) * distanceFromCenter;
      
      const spawnPoint = new THREE.Vector3(x, 0, z);
      this.spawnPoints.push(spawnPoint);
      
      // Create a visual marker for spawn points during development
      const markerGeometry = new THREE.ConeGeometry(1, 2, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        wireframe: true
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, 1, z);
      marker.userData.isSpawnMarker = true;
      this.scene.add(marker);
      this.spawnMarkers.push(marker);
    }
  }
  
  public update(): void {
    // Animate spawn points if needed
    this.spawnMarkers.forEach(marker => {
      marker.rotation.y += 0.01;
    });
  }
  
  public getRandomSpawnPoint(): THREE.Vector3 {
    // Make sure we have spawn points
    if (this.spawnPoints.length === 0) {
      // If no spawn points are defined yet, create a safe default
      return new THREE.Vector3(this.arenaSize * 0.6, 0, this.arenaSize * 0.6);
    }
    
    const index = Math.floor(Math.random() * this.spawnPoints.length);
    return this.spawnPoints[index].clone();
  }
  
  // This method allows us to check if a given point is near any spawn points
  // Useful for validating locations for other objects
  public isNearSpawnPoint(position: THREE.Vector3, minDistance: number = 10): boolean {
    for (const spawnPoint of this.spawnPoints) {
      if (position.distanceTo(spawnPoint) < minDistance) {
        return true;
      }
    }
    return false;
  }
  
  public getEntitiesForMinimap(): any[] {
    const entities: any[] = [];
    
    // Add spawn points to minimap
    this.spawnPoints.forEach(point => {
      entities.push({
        position: point,
        type: 'spawnPoint'
      });
    });
    
    return entities;
  }
  
  public reset(): void {
    // Reset any dynamic spawn point properties if needed
    // Currently no dynamic properties to reset
  }
}
