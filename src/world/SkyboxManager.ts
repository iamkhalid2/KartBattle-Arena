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
    // Create a skybox using BoxGeometry with a CubeTextureMapping approach
    const size = 2500; // Increase the size slightly
    const skyGeometry = new THREE.BoxGeometry(size, size, size);
    
    // Use a single material with BackSide rendering for all faces
    // This ensures the skybox is always rendered correctly regardless of camera angle
    const skyMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      vertexColors: true,
      fog: false // Ensure the skybox isn't affected by fog
    });
    
    // Create the skybox mesh with the material
    const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    
    // Add vertex colors to create a gradient sky effect
    const colors = [
      new THREE.Color(0x87CEEB), // Sky blue
      new THREE.Color(0x4CA3DD), // Darker blue
      new THREE.Color(0x267F00)  // Green for ground
    ];
    
    // Get the position attribute of the geometry
    const positionAttribute = skyGeometry.getAttribute('position');
    const vertexCount = positionAttribute.count;
    
    // Create a color attribute
    const colorAttribute = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3);
    skyGeometry.setAttribute('color', colorAttribute);
    
    // Set vertex colors based on position
    for (let i = 0; i < vertexCount; i++) {
      const y = positionAttribute.getY(i);
      const normalizedY = (y / (size / 2) + 1) / 2; // Convert to range 0-1
      
      let color;
      if (y < -size / 3) {
        // Bottom part (ground)
        color = colors[2];
      } else if (y > size / 3) {
        // Upper part (sky)
        color = colors[0];
      } else {
        // Middle part (horizon)
        const t = (y + size / 3) / (2 * size / 3); // Normalize to 0-1
        color = new THREE.Color().lerpColors(colors[1], colors[0], t);
      }
      
      colorAttribute.setXYZ(i, color.r, color.g, color.b);
    }
    
    // Add the skybox to the scene with a high renderOrder to ensure it's rendered last
    skybox.renderOrder = -1000;
    this.scene.add(skybox);
    
    return skybox;
  }
  
  private createClouds(): void {
    const cloudGeometry = new THREE.SphereGeometry(2, 8, 8);
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
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
    
    // Ensure the skybox is always rendered (not culled)
    this.skybox.frustumCulled = false;
  }
  
  public reset(): void {
    // Reset skybox position
    this.skybox.position.set(0, 0, 0);
  }
}