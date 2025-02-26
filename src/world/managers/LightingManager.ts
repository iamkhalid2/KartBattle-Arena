import * as THREE from 'three';

export class LightingManager {
  private scene: THREE.Scene;
  private arenaSize: number;
  private lights: THREE.Light[] = [];
  
  constructor(scene: THREE.Scene, arenaSize: number) {
    this.scene = scene;
    this.arenaSize = arenaSize;
  }
  
  public createLights(): void {
    this.createAmbientLight();
    this.createDirectionalLight();
    this.createSpotlights();
  }
  
  private createAmbientLight(): void {
    // Main ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
  }
  
  private createDirectionalLight(): void {
    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    
    // Set up shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -this.arenaSize/1.5;
    directionalLight.shadow.camera.right = this.arenaSize/1.5;
    directionalLight.shadow.camera.top = this.arenaSize/1.5;
    directionalLight.shadow.camera.bottom = -this.arenaSize/1.5;
    
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
  }
  
  private createSpotlights(): void {
    // Add colored spotlights around the arena for visual interest
    const spotColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
    const spotPositions = [
      new THREE.Vector3(this.arenaSize/2, 20, this.arenaSize/2),
      new THREE.Vector3(-this.arenaSize/2, 20, this.arenaSize/2),
      new THREE.Vector3(this.arenaSize/2, 20, -this.arenaSize/2),
      new THREE.Vector3(-this.arenaSize/2, 20, -this.arenaSize/2)
    ];
    
    for (let i = 0; i < spotColors.length; i++) {
      const spotLight = new THREE.SpotLight(spotColors[i], 0.5);
      spotLight.position.copy(spotPositions[i]);
      spotLight.angle = Math.PI / 6;
      spotLight.penumbra = 0.2;
      spotLight.distance = 100;
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 512;
      spotLight.shadow.mapSize.height = 512;
      
      // Point toward center
      spotLight.target.position.set(0, 0, 0);
      this.scene.add(spotLight.target);
      this.scene.add(spotLight);
      this.lights.push(spotLight);
    }
  }
  
  public update(deltaTime: number): void {
    // Update lighting effects if needed
    // e.g., color cycling, intensity changes, etc.
  }
}
