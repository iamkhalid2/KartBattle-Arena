// TerrainManager.ts - Handles terrain generation and management
import * as THREE from 'three';

export class TerrainManager {
  private scene: THREE.Scene;
  private terrain: THREE.Object3D;
  private worldSize: number;
  private roadElements: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene, worldSize: number) {
    this.scene = scene;
    this.worldSize = worldSize;
    this.terrain = new THREE.Object3D();
    this.scene.add(this.terrain);
  }

  public createGround(): void {
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
  }

  public generateRoads(chunkX: number, chunkZ: number, chunkSize: number): void {
    const roadWidth = 10;
    const roadGroup = new THREE.Group();
    
    // Create a horizontal road
    const horizontalRoadGeometry = new THREE.PlaneGeometry(chunkSize, roadWidth);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8 
    });
    
    const horizontalRoad = new THREE.Mesh(horizontalRoadGeometry, roadMaterial);
    horizontalRoad.rotation.x = -Math.PI / 2;
    horizontalRoad.position.set(chunkX, 0, chunkZ);
    roadGroup.add(horizontalRoad);
    
    // Create a vertical road that intersects the horizontal one
    const verticalRoadGeometry = new THREE.PlaneGeometry(roadWidth, chunkSize);
    const verticalRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    verticalRoad.rotation.x = -Math.PI / 2;
    verticalRoad.position.set(chunkX, 0, chunkZ);
    roadGroup.add(verticalRoad);
    
    // Add road markings - center white dashed lines
    this.addRoadMarkings(roadGroup, chunkX, chunkZ, chunkSize);
    
    this.terrain.add(roadGroup);
    this.roadElements.push(roadGroup);
  }
  
  private addRoadMarkings(roadGroup: THREE.Group, chunkX: number, chunkZ: number, chunkSize: number): void {
    const dashLength = 3;
    const dashGap = 3;
    const numDashes = Math.floor(chunkSize / (dashLength + dashGap));
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Horizontal road markings
    for (let i = 0; i < numDashes; i++) {
      const lineGeometry = new THREE.PlaneGeometry(dashLength, 0.3);
      const dash = new THREE.Mesh(lineGeometry, lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(
        chunkX - chunkSize/2 + i * (dashLength + dashGap) + dashLength/2,
        0.01, // Slightly above road
        chunkZ
      );
      roadGroup.add(dash);
    }
    
    // Vertical road markings
    for (let i = 0; i < numDashes; i++) {
      const lineGeometry = new THREE.PlaneGeometry(0.3, dashLength);
      const dash = new THREE.Mesh(lineGeometry, lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(
        chunkX,
        0.01, // Slightly above road
        chunkZ - chunkSize/2 + i * (dashLength + dashGap) + dashLength/2
      );
      roadGroup.add(dash);
    }
  }
  
  public getTerrainHeight(x: number, z: number): number {
    // For now, the terrain is flat at y=0
    return 0;
  }
  
  public getRoadWidth(): number {
    return 10; // Standard road width
  }
  
  public reset(): void {
    // Remove all road elements
    this.roadElements.forEach(element => {
      this.terrain.remove(element);
    });
    this.roadElements = [];
  }
}