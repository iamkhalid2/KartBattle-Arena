// SkyboxManager.ts - Handles skybox creation and management
import * as THREE from 'three';

export class SkyboxManager {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh;
  private time: number = 0;
  private cloudPlane: THREE.Mesh | null = null;
  private cloudPlane2: THREE.Mesh | null = null; // Second layer for more depth

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Explicitly set scene background color to blue to ensure it's not black
    this.scene.background = new THREE.Color(0x4799ff);
    
    this.skybox = this.createGradientSkybox();
    
    // Create two cloud layers for more visual depth
    this.cloudPlane = this.createCloudPlane(400, 0.4);
    this.cloudPlane2 = this.createCloudPlane(500, 0.3); // Higher, more transparent layer
    
    // Enhanced fog with more blue tint to match the sky
    this.scene.fog = new THREE.FogExp2(0x99ccff, 0.0008);
  }

  private createGradientSkybox(): THREE.Mesh {
    // Create a full sphere instead of a dome for better coverage
    const size = 2000;
    const skyGeometry = new THREE.SphereGeometry(size, 32, 32); // Use full sphere with higher detail
    
    // Create vertex colors for a vibrant blue gradient
    const colors = [
      new THREE.Color(0x0c4d90), // Deeper blue at top
      new THREE.Color(0x1a72c2), // Mid-blue
      new THREE.Color(0x4799ff), // Light blue
      new THREE.Color(0x88ccff)  // Pale blue near horizon
    ];
    
    const positionAttribute = skyGeometry.getAttribute('position');
    const count = positionAttribute.count;
    
    // Create color attribute
    const colorAttribute = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    
    // Apply gradient colors based on y-position
    for (let i = 0; i < count; i++) {
      const y = positionAttribute.getY(i) / size; // Normalize to -1 to 1 range
      
      // Calculate color based on absolute height value (0 to 1)
      let absY = Math.abs(y);
      let finalColor = new THREE.Color();
      
      if (y > 0.3) {
        // Top part - deep to mid blue
        const t = (y - 0.3) / 0.7; // Normalize 0.3-1.0 to 0-1
        finalColor.lerpColors(colors[1], colors[0], t);
      } else if (y > -0.3) {
        // Middle part - mid blue to light blue
        const t = (y + 0.3) / 0.6; // Normalize -0.3-0.3 to 0-1
        finalColor.lerpColors(colors[2], colors[1], t);
      } else {
        // Bottom part - light blue to pale blue
        const t = (y + 1) / 0.7; // Normalize -1.0--0.3 to 0-1
        finalColor.lerpColors(colors[3], colors[2], t);
      }
      
      colorAttribute.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
    }
    
    skyGeometry.setAttribute('color', colorAttribute);
    
    // Create material with vertex colors - ensure it's visible and properly positioned
    const skyMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide, // Important: Render on the inside of the sphere
      fog: false,
      transparent: false,
      depthWrite: false, // Prevent depth issues
      depthTest: false  // Ensure it renders behind everything
    });
    
    // Create mesh and add to scene
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    
    // Ensure the skybox is rendered by giving it a very high rendering order
    skyDome.renderOrder = -1000; // Very early in the rendering queue
    
    this.scene.add(skyDome);
    
    return skyDome;
  }

  private createCloudPlane(height: number, opacity: number): THREE.Mesh {
    // Create a much larger cloud plane that will cover more of the sky
    const planeGeometry = new THREE.PlaneGeometry(8000, 8000);
    
    // Create cloud material using noise pattern
    const cloudMaterial = new THREE.MeshBasicMaterial({
      map: this.createCloudTexture(),
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      side: THREE.DoubleSide // Make clouds visible from both sides
    });
    
    const cloudPlane = new THREE.Mesh(planeGeometry, cloudMaterial);
    cloudPlane.rotation.x = -Math.PI / 2;
    cloudPlane.position.y = height;
    this.scene.add(cloudPlane);
    
    return cloudPlane;
  }
  
  private createCloudTexture(): THREE.Texture {
    // Create procedural cloud texture with canvas - enhanced for better clouds
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Higher resolution for better detail
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d')!;
    
    // Fill with blue-tinted background
    ctx.fillStyle = 'rgba(135, 206, 250, 0.01)'; // Very light blue tint
    ctx.fillRect(0, 0, 512, 512);
    
    // Create several layers of clouds for more realism
    this.drawCloudLayer(ctx, 150, 0.15); // Large diffuse clouds
    this.drawCloudLayer(ctx, 80, 0.2);  // Medium clouds
    this.drawCloudLayer(ctx, 40, 0.25); // Small detailed clouds
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8); // More repeats for more cloud coverage
    
    return texture;
  }
  
  private drawCloudLayer(ctx: CanvasRenderingContext2D, blobCount: number, maxOpacity: number): void {
    // Draw a layer of cloud blobs
    for (let i = 0; i < blobCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = Math.random() * 60 + 20;
      
      // Create fluffy cloud shape
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const opacity = Math.random() * maxOpacity + 0.05;
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.4, `rgba(255, 255, 255, ${opacity * 0.7})`);
      gradient.addColorStop(0.8, `rgba(255, 255, 255, ${opacity * 0.3})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  public update(deltaTime: number): void {
    // Very minimal animation
    this.time += deltaTime * 0.01;
    
    // Animate cloud layers at different speeds for parallax effect
    if (this.cloudPlane?.material instanceof THREE.MeshBasicMaterial && 
        this.cloudPlane.material.map) {
      this.cloudPlane.material.map.offset.x = this.time * 0.01;
      this.cloudPlane.material.map.needsUpdate = true;
    }
    
    if (this.cloudPlane2?.material instanceof THREE.MeshBasicMaterial && 
        this.cloudPlane2.material.map) {
      this.cloudPlane2.material.map.offset.x = this.time * 0.005; // Slower movement for distant clouds
      this.cloudPlane2.material.map.offset.y = Math.sin(this.time * 0.002) * 0.01; // Subtle drift
      this.cloudPlane2.material.map.needsUpdate = true;
    }
  }

  public updatePosition(playerPosition: THREE.Vector3): void {
    // Update skybox position to follow the player
    this.skybox.position.x = playerPosition.x;
    this.skybox.position.z = playerPosition.z;
    
    // Also update cloud planes
    if (this.cloudPlane) {
      this.cloudPlane.position.x = playerPosition.x;
      this.cloudPlane.position.z = playerPosition.z;
    }
    
    if (this.cloudPlane2) {
      this.cloudPlane2.position.x = playerPosition.x;
      this.cloudPlane2.position.z = playerPosition.z;
    }
  }
  
  public reset(): void {
    // Reset skybox position
    this.skybox.position.set(0, 0, 0);
    if (this.cloudPlane) {
      this.cloudPlane.position.set(0, 400, 0);
    }
    if (this.cloudPlane2) {
      this.cloudPlane2.position.set(0, 500, 0);
    }
    this.time = 0;
  }
}