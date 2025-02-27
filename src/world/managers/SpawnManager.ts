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
      const distanceFromCenter = this.arenaSize * 0.4; // 40% from center to edge
      
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
    // Removed unused deltaTime parameter
    this.spawnMarkers.forEach(marker => {
      marker.rotation.y += 0.01;
    });
  }
  
  public getRandomSpawnPoint(): THREE.Vector3 {
    const index = Math.floor(Math.random() * this.spawnPoints.length);
    return this.spawnPoints[index].clone();
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
  }
}
