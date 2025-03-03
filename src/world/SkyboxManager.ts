// SkyboxManager.ts - Handles skybox creation and management
import * as THREE from 'three';

export class SkyboxManager {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh;
  // Removed stars and clouds for better performance
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.skybox = this.createGradientSkybox();
    
    // Removed stylized clouds for performance
    // Removed stars for performance
    
    // Changed to a much lighter fog effect
    this.scene.fog = new THREE.FogExp2(0x88ccee, 0.001); // Reduced fog density
  }

  private createGradientSkybox(): THREE.Mesh {
    // Create a large dome for the sky, but simplified
    const size = 2000;
    const skyGeometry = new THREE.SphereGeometry(size, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2); // Reduced segments
    
    // Create vertex colors for a beautiful gradient
    const colors = [
      new THREE.Color(0x1e3c72), // Deep blue (at the top)
      new THREE.Color(0x2a5298), // Mid blue
      new THREE.Color(0x4776E6), // Light blue
      new THREE.Color(0x8E54E9)  // Purple/pink for sunset effect at horizon
    ];
    
    const positionAttribute = skyGeometry.getAttribute('position');
    const count = positionAttribute.count;
    
    // Create color attribute
    const colorAttribute = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    
    // Apply gradient colors based on y-position - using simpler calculations
    for (let i = 0; i < count; i++) {
      const y = positionAttribute.getY(i) / size; // Normalize to 0-1 range
      
      // Calculate color based on height with simpler calculations
      let finalColor = new THREE.Color();
      
      if (y > 0.5) {
        // Top part - deep to mid blue
        const t = (y - 0.5) * 2; // Normalize 0.5-1.0 to 0-1
        finalColor.lerpColors(colors[1], colors[0], t);
      } else {
        // Bottom part - mid blue to horizon
        const t = y * 2; // Normalize 0-0.5 to 0-1
        finalColor.lerpColors(colors[3], colors[1], t);
      }
      
      colorAttribute.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
    }
    
    skyGeometry.setAttribute('color', colorAttribute);
    
    // Create material with vertex colors
    const skyMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false
    });
    
    // Create mesh and add to scene
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    skyDome.rotation.x = Math.PI; // Flip the dome to face inward
    skyDome.position.y = -100; // Lower it a bit to create better horizon effect
    this.scene.add(skyDome);
    
    return skyDome;
  }

  public update(deltaTime: number): void {
    // Removed all animations for better performance
    this.time += deltaTime * 0.05;
    // No updates needed for static skybox
  }

  public updatePosition(playerPosition: THREE.Vector3): void {
    // Update skybox position to follow the player
    this.skybox.position.x = playerPosition.x;
    this.skybox.position.z = playerPosition.z;
  }
  
  public reset(): void {
    // Reset skybox position
    this.skybox.position.set(0, 0, 0);
    this.time = 0;
  }
}