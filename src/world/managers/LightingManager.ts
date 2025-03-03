import * as THREE from 'three';

export class LightingManager {
  private scene: THREE.Scene;
  private arenaSize: number;
  private lights: THREE.Light[] = [];
  private time: number = 0;
  
  constructor(scene: THREE.Scene, arenaSize: number) {
    this.scene = scene;
    this.arenaSize = arenaSize;
  }
  
  public createLights(): void {
    this.createAmbientLight();
    this.createDirectionalLight();
    // Add a subtle hemisphere light for better ambient lighting
    this.createHemisphereLight();
  }
  
  private createAmbientLight(): void {
    // Main ambient light - slightly blue-tinted for cooler atmosphere
    const ambientLight = new THREE.AmbientLight(0xc4d7ff, 0.4); // Reduced intensity to work with hemisphere light
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
  }
  
  private createHemisphereLight(): void {
    // Add hemisphere light for more natural ambient lighting (sky/ground)
    // This is very efficient and adds a lot of depth
    const hemiLight = new THREE.HemisphereLight(
      0x8fbeff, // Sky color - light blue
      0x063e20, // Ground color - dark green
      0.5 // Intensity
    );
    this.scene.add(hemiLight);
    this.lights.push(hemiLight);
  }
  
  private createDirectionalLight(): void {
    // Main directional light (sun) with warmer tone
    const directionalLight = new THREE.DirectionalLight(0xffebc4, 0.9); // Warmer sunlight color
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    
    // Enhanced shadow resolution while maintaining performance
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    
    // More precise shadow framing for sharper shadows
    directionalLight.shadow.camera.left = -this.arenaSize/1.5;
    directionalLight.shadow.camera.right = this.arenaSize/1.5;
    directionalLight.shadow.camera.top = this.arenaSize/1.5;
    directionalLight.shadow.camera.bottom = -this.arenaSize/1.5;
    
    // Sharper shadows by adjusting these parameters
    directionalLight.shadow.bias = -0.0003; // Reduced bias for sharper edges
    directionalLight.shadow.normalBias = 0.02; // Reduced for sharper shadows
    directionalLight.shadow.radius = 1; // Reduced for sharper edges
    
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
    
    // Add a secondary fill light from the opposite direction with blue tone
    // for more depth and contrast - no shadows for better performance
    const fillLight = new THREE.DirectionalLight(0x7080ff, 0.4);
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
