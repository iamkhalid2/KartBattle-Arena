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
      // Place spawn points at 45% of arena size from center - ensuring they're inside the arena
      // while still staying away from the center hazard areas (at 30% radius)
      const distanceFromCenter = this.arenaSize * 0.45; 
      
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
  
  // Check if the given position is close to any hazard position
  public isNearHazard(position: THREE.Vector3, hazardPositions: THREE.Vector3[], minDistance: number = 20): boolean {
    for (const hazardPos of hazardPositions) {
      if (position.distanceTo(hazardPos) < minDistance) {
        return true;
      }
    }
    return false;
  }
  
  // Get a spawn point that's far from any hazards
  public getRandomSpawnPointAwayFromHazards(hazardPositions: THREE.Vector3[]): THREE.Vector3 {
    // Make sure we have spawn points
    if (this.spawnPoints.length === 0) {
      // If no spawn points are defined yet, create a safe default at 40% arena radius
      return new THREE.Vector3(this.arenaSize * 0.4, 0, this.arenaSize * 0.4);
    }
    
    // First try existing spawn points, shuffled randomly
    const shuffledIndices = Array.from({length: this.spawnPoints.length}, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    
    for (const index of shuffledIndices) {
      const spawnPoint = this.spawnPoints[index];
      
      // Check if this spawn is away from hazards
      if (!this.isNearHazard(spawnPoint, hazardPositions, 20)) {
        return spawnPoint.clone();
      }
    }
    
    // If all spawn points are near hazards, find the one farthest from any hazard
    let bestSpawnPoint = this.spawnPoints[0];
    let maxDistance = 0;
    
    for (const spawnPoint of this.spawnPoints) {
      let minDistToHazard = Number.MAX_VALUE;
      
      for (const hazardPos of hazardPositions) {
        const distance = spawnPoint.distanceTo(hazardPos);
        minDistToHazard = Math.min(minDistToHazard, distance);
      }
      
      if (minDistToHazard > maxDistance) {
        maxDistance = minDistToHazard;
        bestSpawnPoint = spawnPoint;
      }
    }
    
    return bestSpawnPoint.clone();
  }
  
  public getRandomSpawnPoint(): THREE.Vector3 {
    // Make sure we have spawn points
    if (this.spawnPoints.length === 0) {
      // If no spawn points are defined yet, create a safe default at 40% arena radius
      return new THREE.Vector3(this.arenaSize * 0.4, 0, this.arenaSize * 0.4);
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
  
  public update(): void {
    // Animate spawn points if needed
    this.spawnMarkers.forEach(marker => {
      marker.rotation.y += 0.01;
    });
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
