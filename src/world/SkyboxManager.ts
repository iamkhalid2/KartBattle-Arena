// SkyboxManager.ts - Handles skybox creation and management
import * as THREE from 'three';

export class SkyboxManager {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh;
  private clouds: THREE.Group;
  private stars: THREE.Points;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.skybox = this.createGradientSkybox();
    this.clouds = this.createStylizedClouds();
    this.stars = this.createStars();
    
    // Add a subtle fog effect
    this.scene.fog = new THREE.FogExp2(0x88ccee, 0.002);
  }

  private createGradientSkybox(): THREE.Mesh {
    // Create a large dome for the sky
    const size = 2000;
    const skyGeometry = new THREE.SphereGeometry(size, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    
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
    
    // Apply gradient colors based on y-position
    for (let i = 0; i < count; i++) {
      const y = positionAttribute.getY(i) / size; // Normalize to 0-1 range
      
      // Calculate color based on height
      let finalColor = new THREE.Color();
      
      if (y > 0.75) {
        // Top part - deep blue
        finalColor.copy(colors[0]);
      } else if (y > 0.5) {
        // Upper middle - blend between deep and mid blue
        const t = (y - 0.5) * 4; // Normalize 0.5-0.75 to 0-1
        finalColor.lerpColors(colors[1], colors[0], t);
      } else if (y > 0.1) {
        // Lower middle - blend between mid and light blue
        const t = (y - 0.1) * 2.5; // Normalize 0.1-0.5 to 0-1
        finalColor.lerpColors(colors[2], colors[1], t);
      } else {
        // Bottom part (horizon) - blend to purple/pink
        const t = y * 10; // Normalize 0-0.1 to 0-1
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

  private createStylizedClouds(): THREE.Group {
    const cloudsGroup = new THREE.Group();
    
    // Create different cloud shapes using merged geometries
    const cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      emissive: 0x444444,
      emissiveIntensity: 0.1
    });
    
    // Create 30 clouds at different positions
    for (let i = 0; i < 30; i++) {
      // Create a cloud from multiple spheres
      const cloudPieces = new THREE.Group();
      const numPieces = 3 + Math.floor(Math.random() * 5);
      
      for (let j = 0; j < numPieces; j++) {
        const size = 10 + Math.random() * 20;
        const geometry = new THREE.SphereGeometry(size, 7, 7);
        const piece = new THREE.Mesh(geometry, cloudMaterial);
        
        // Position each piece to form a cloud-like shape
        piece.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 15
        );
        
        // Flatten the cloud a bit
        piece.scale.y = 0.4 + Math.random() * 0.2;
        
        cloudPieces.add(piece);
      }
      
      // Position the cloud in the sky
      const radius = 500 + Math.random() * 1000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.PI / 2 - Math.random() * Math.PI / 6; // Keep clouds in upper hemisphere
      
      cloudPieces.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) + 100, // Keep clouds high in the sky
        radius * Math.sin(phi) * Math.sin(theta)
      );
      
      cloudPieces.scale.set(
        1.5 + Math.random() * 2,
        1 + Math.random(),
        1.5 + Math.random() * 2
      );
      
      cloudsGroup.add(cloudPieces);
    }
    
    this.scene.add(cloudsGroup);
    return cloudsGroup;
  }

  private createStars(): THREE.Points {
    // Create stars in the sky
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Position stars in upper hemisphere
      const radius = 1800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI / 2; // Only in upper hemisphere
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Star colors - white with slight variations
      const brightness = 0.7 + Math.random() * 0.3;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness + Math.random() * 0.1;
      
      // Star sizes
      sizes[i] = 1.5 + Math.random() * 1.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Star material with custom shaders for better looking points
    const starsMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
    
    return stars;
  }

  public update(deltaTime: number): void {
    // Animate clouds slowly rotating around the center
    this.time += deltaTime * 0.05;
    
    // Rotate clouds slowly
    this.clouds.rotation.y = this.time * 0.01;
    
    // Make stars twinkle slightly
    if (this.stars && this.stars.geometry.attributes.size) {
      const sizes = this.stars.geometry.attributes.size;
      for (let i = 0; i < sizes.count; i++) {
        sizes.array[i] = 1.5 + Math.random() * 1.5;
      }
      sizes.needsUpdate = true;
    }
  }

  public updatePosition(playerPosition: THREE.Vector3): void {
    // Update skybox position to follow the player
    this.skybox.position.x = playerPosition.x;
    this.skybox.position.z = playerPosition.z;
    
    this.clouds.position.x = playerPosition.x;
    this.clouds.position.z = playerPosition.z;
    
    this.stars.position.x = playerPosition.x;
    this.stars.position.z = playerPosition.z;
  }
  
  public reset(): void {
    // Reset skybox position
    this.skybox.position.set(0, 0, 0);
    this.clouds.position.set(0, 0, 0);
    this.stars.position.set(0, 0, 0);
    this.time = 0;
  }
}