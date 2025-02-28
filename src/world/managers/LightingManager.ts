import * as THREE from 'three';

export class LightingManager {
  private scene: THREE.Scene;
  private arenaSize: number;
  private lights: THREE.Light[] = [];
  private dynamicLights: THREE.Light[] = [];
  private time: number = 0;
  
  constructor(scene: THREE.Scene, arenaSize: number) {
    this.scene = scene;
    this.arenaSize = arenaSize;
  }
  
  public createLights(): void {
    this.createAmbientLight();
    this.createDirectionalLight();
    this.createSpotlights();
    this.createRimLights();
    this.createArenaFloorLights();
  }
  
  private createAmbientLight(): void {
    // Main ambient light - slightly blue-tinted for cooler atmosphere
    const ambientLight = new THREE.AmbientLight(0xc4d7ff, 0.5);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
  }
  
  private createDirectionalLight(): void {
    // Main directional light (sun) with warmer tone
    const directionalLight = new THREE.DirectionalLight(0xffedcc, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    
    // Set up shadow properties for better quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -this.arenaSize/1.5;
    directionalLight.shadow.camera.right = this.arenaSize/1.5;
    directionalLight.shadow.camera.top = this.arenaSize/1.5;
    directionalLight.shadow.camera.bottom = -this.arenaSize/1.5;
    
    // Soften shadows
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.normalBias = 0.02;
    directionalLight.shadow.radius = 1.5;
    
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
    
    // Add a secondary fill light from the opposite direction with blue tone
    // for more depth and contrast
    const fillLight = new THREE.DirectionalLight(0x7080ff, 0.3);
    fillLight.position.set(-100, 50, -100);
    fillLight.castShadow = false; // No shadows from fill light
    this.scene.add(fillLight);
    this.lights.push(fillLight);
  }
  
  private createSpotlights(): void {
    // Add colored spotlights around the arena with more vibrant colors
    const spotColors = [
      0xff3300, // Orange-red
      0x00ccff, // Cyan
      0xcc00ff, // Magenta
      0xffcc00  // Gold
    ];
    
    const spotPositions = [
      new THREE.Vector3(this.arenaSize/2, 30, this.arenaSize/2),
      new THREE.Vector3(-this.arenaSize/2, 30, this.arenaSize/2),
      new THREE.Vector3(this.arenaSize/2, 30, -this.arenaSize/2),
      new THREE.Vector3(-this.arenaSize/2, 30, -this.arenaSize/2)
    ];
    
    for (let i = 0; i < spotColors.length; i++) {
      const spotLight = new THREE.SpotLight(spotColors[i], 0.8);
      spotLight.position.copy(spotPositions[i]);
      spotLight.angle = Math.PI / 8; // Narrower angle for more defined beams
      spotLight.penumbra = 0.3; // Softer edge
      spotLight.distance = 150;
      spotLight.decay = 2; // Realistic light falloff
      spotLight.castShadow = true;
      
      // Higher resolution shadows for spotlights
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      spotLight.shadow.bias = -0.0005;
      
      // Create a target slightly off-center for dynamic lighting
      const targetOffset = 20;
      const targetX = Math.random() * targetOffset - targetOffset/2;
      const targetZ = Math.random() * targetOffset - targetOffset/2;
      
      spotLight.target.position.set(targetX, 0, targetZ);
      this.scene.add(spotLight.target);
      this.scene.add(spotLight);
      this.lights.push(spotLight);
      this.dynamicLights.push(spotLight);
    }
  }
  
  private createRimLights(): void {
    // Add rim lights around the arena perimeter for edge highlighting
    const rimCount = 8;
    const rimColor = 0x4040ff; // Blue rim light
    const rimHeight = 5;
    const halfSize = this.arenaSize / 2;
    
    for (let i = 0; i < rimCount; i++) {
      const angle = (i / rimCount) * Math.PI * 2;
      const x = Math.sin(angle) * halfSize * 0.9;
      const z = Math.cos(angle) * halfSize * 0.9;
      
      // Use point lights for rim effects
      const rimLight = new THREE.PointLight(rimColor, 1, 25);
      rimLight.position.set(x, rimHeight, z);
      rimLight.castShadow = false; // No shadows from rim lights
      rimLight.decay = 2;
      
      this.scene.add(rimLight);
      this.lights.push(rimLight);
      this.dynamicLights.push(rimLight);
    }
  }
  
  private createArenaFloorLights(): void {
    // Add subtle floor lighting for extra atmosphere
    const floorLightCount = 4;
    const floorLightColors = [
      0x2200ff, // Deep blue
      0x00ffcc, // Teal
      0xff00aa, // Pink
      0x88ff00  // Lime
    ];
    
    const radius = this.arenaSize * 0.3;
    
    for (let i = 0; i < floorLightCount; i++) {
      const angle = (i / floorLightCount) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      
      const floorLight = new THREE.PointLight(floorLightColors[i], 0.8, 30);
      floorLight.position.set(x, 0.5, z);
      floorLight.castShadow = false;
      floorLight.decay = 2;
      
      this.scene.add(floorLight);
      this.lights.push(floorLight);
      this.dynamicLights.push(floorLight);
    }
  }
  
  public update(deltaTime: number): void {
    // Animate dynamic lights
    this.time += deltaTime;
    
    // Animate spotlight targets for moving light effect
    this.dynamicLights.forEach((light, index) => {
      if (light instanceof THREE.SpotLight && light.target) {
        const speed = 0.5 + index * 0.2;
        const radius = 10 + index * 5;
        
        // Create circular motion for spotlight targets
        const targetX = Math.sin(this.time * speed) * radius;
        const targetZ = Math.cos(this.time * speed) * radius;
        
        // Update target position
        light.target.position.x = targetX;
        light.target.position.z = targetZ;
      }
      
      // Pulse light intensity for more dynamic effect
      const pulseRate = 1 + index * 0.2;
      const pulseAmount = Math.sin(this.time * pulseRate) * 0.3 + 0.7;
      
      // Apply pulse to intensity
      if (light.intensity > 0) {
        // Store original intensity if not set
        if (!(light as any).originalIntensity) {
          (light as any).originalIntensity = light.intensity;
        }
        
        // Apply pulsing effect
        light.intensity = (light as any).originalIntensity * pulseAmount;
      }
    });
  }
  
  // Add helper method to visualize light positions during development
  public createLightHelpers(): void {
    this.lights.forEach(light => {
      let helper;
      
      if (light instanceof THREE.DirectionalLight) {
        helper = new THREE.DirectionalLightHelper(light, 5);
      } else if (light instanceof THREE.SpotLight) {
        helper = new THREE.SpotLightHelper(light);
      } else if (light instanceof THREE.PointLight) {
        helper = new THREE.PointLightHelper(light, 1);
      }
      
      if (helper) {
        this.scene.add(helper);
      }
    });
  }
}
