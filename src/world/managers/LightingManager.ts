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
    // Removed spotlights for better performance
    // Removed rim lights for better performance
    // Removed floor lights for better performance
  }
  
  private createAmbientLight(): void {
    // Main ambient light - slightly blue-tinted for cooler atmosphere
    const ambientLight = new THREE.AmbientLight(0xc4d7ff, 0.7); // Increased intensity to compensate for removed lights
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
  }
  
  private createDirectionalLight(): void {
    // Main directional light (sun) with warmer tone
    const directionalLight = new THREE.DirectionalLight(0xffedcc, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    
    // Reduced shadow resolution for better performance
    directionalLight.shadow.mapSize.width = 1024; // Reduced from 2048
    directionalLight.shadow.mapSize.height = 1024; // Reduced from 2048
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -this.arenaSize/1.5;
    directionalLight.shadow.camera.right = this.arenaSize/1.5;
    directionalLight.shadow.camera.top = this.arenaSize/1.5;
    directionalLight.shadow.camera.bottom = -this.arenaSize/1.5;
    
    // Basic shadow settings
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.normalBias = 0.02;
    directionalLight.shadow.radius = 1.5;
    
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
    
    // Add a secondary fill light from the opposite direction with blue tone
    // for more depth and contrast - no shadows for better performance
    const fillLight = new THREE.DirectionalLight(0x7080ff, 0.3);
    fillLight.position.set(-100, 50, -100);
    fillLight.castShadow = false;
    this.scene.add(fillLight);
    this.lights.push(fillLight);
  }
  
  public update(deltaTime: number): void {
    // Removed all dynamic light animations for better performance
    this.time += deltaTime;
    // No updates needed for static lights
  }
}
