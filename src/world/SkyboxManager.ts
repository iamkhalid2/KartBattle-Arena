// SkyboxManager.ts - Handles skybox creation and management
import * as THREE from 'three';

export class SkyboxManager {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh;
  private time: number = 0;
  private cloudPlane: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.skybox = this.createGradientSkybox();
    
    // Add lightweight cloud texture for visual depth
    this.cloudPlane = this.createCloudPlane();
    
    // Efficient fog that creates depth
    this.scene.fog = new THREE.FogExp2(0x88ccee, 0.0008);
  }

  private createGradientSkybox(): THREE.Mesh {
    // Create a large dome for the sky, but simplified
    const size = 2000;
    const skyGeometry = new THREE.SphereGeometry(size, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2); // Low poly is fine for sky
    
    // Create vertex colors for a vibrant gradient
    const colors = [
      new THREE.Color(0x0c2d60), // Deep blue (at the top)
      new THREE.Color(0x1a4b8c), // Mid blue
      new THREE.Color(0x4776E6), // Light blue
      new THREE.Color(0xa742f5)  // More vivid purple for sunrise/sunset effect
    ];
    
    const positionAttribute = skyGeometry.getAttribute('position');
    const count = positionAttribute.count;
    
    // Create color attribute
    const colorAttribute = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    
    // Apply gradient colors based on y-position
    for (let i = 0; i < count; i++) {
      const y = positionAttribute.getY(i) / size; // Normalize to 0-1 range
      
      // Calculate color based on height with simpler calculations
      let finalColor = new THREE.Color();
      
      if (y > 0.6) {
        // Top part - deep to mid blue
        const t = (y - 0.6) * 2.5; // Normalize 0.6-1.0 to 0-1
        finalColor.lerpColors(colors[1], colors[0], t);
      } else if (y > 0.2) {
        // Middle part - mid blue to light blue
        const t = (y - 0.2) * 2.5; // Normalize 0.2-0.6 to 0-1
        finalColor.lerpColors(colors[2], colors[1], t);
      } else {
        // Bottom part - light blue to purple horizon
        const t = y * 5; // Normalize 0-0.2 to 0-1
        finalColor.lerpColors(colors[3], colors[2], t);
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

  private createCloudPlane(): THREE.Mesh {
    // Create a simple cloud plane at the top of the scene
    // This uses very minimal resources but adds visual interest
    const planeGeometry = new THREE.PlaneGeometry(4000, 4000);
    
    // Create cloud material using noise pattern
    const cloudMaterial = new THREE.MeshBasicMaterial({
      map: this.createCloudTexture(),
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    
    const cloudPlane = new THREE.Mesh(planeGeometry, cloudMaterial);
    cloudPlane.rotation.x = -Math.PI / 2;
    cloudPlane.position.y = 400;
    this.scene.add(cloudPlane);
    
    return cloudPlane;
  }
  
  private createCloudTexture(): THREE.Texture {
    // Create procedural cloud texture with canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d')!;
    
    // Fill with gradient
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add noise for cloud-like texture
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const radius = Math.random() * 40 + 10;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }

  public update(deltaTime: number): void {
    // Very minimal animation
    this.time += deltaTime * 0.01;
    
    // Subtle cloud movement
    if (this.cloudPlane && this.cloudPlane.material instanceof THREE.MeshBasicMaterial && 
        this.cloudPlane.material.map) {
      this.cloudPlane.material.map.offset.x = this.time * 0.01;
      this.cloudPlane.material.map.needsUpdate = true;
    }
  }

  public updatePosition(playerPosition: THREE.Vector3): void {
    // Update skybox position to follow the player
    this.skybox.position.x = playerPosition.x;
    this.skybox.position.z = playerPosition.z;
    
    // Also update cloud plane
    if (this.cloudPlane) {
      this.cloudPlane.position.x = playerPosition.x;
      this.cloudPlane.position.z = playerPosition.z;
    }
  }
  
  public reset(): void {
    // Reset skybox position
    this.skybox.position.set(0, 0, 0);
    if (this.cloudPlane) {
      this.cloudPlane.position.set(0, 400, 0);
    }
    this.time = 0;
  }
}