// SkyboxManager.ts - Handles skybox creation and management
import * as THREE from 'three';

export class SkyboxManager {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh;
  private clouds: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.skybox = this.createSkybox();
    this.createClouds();
  }

  private createSkybox(): THREE.Mesh {
    // Create a skybox using BoxGeometry with specific materials for each face
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
    const skybox = new THREE.Mesh(skyGeometry, skyMaterials);
    this.scene.add(skybox);
    
    return skybox;
  }
  
  private createClouds(): void {
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
      this.clouds.push(cloud);
    }
  }

  public updatePosition(playerPosition: THREE.Vector3): void {
    // Update skybox position to follow the player
    this.skybox.position.copy(playerPosition);
  }
  
  public reset(): void {
    // Reset skybox position
    this.skybox.position.set(0, 0, 0);
  }
}