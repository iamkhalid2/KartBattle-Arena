// TerrainManager.ts - Handles terrain generation and management
import * as THREE from 'three';

export class TerrainManager {
  private scene: THREE.Scene;
  private terrain: THREE.Object3D;
  private worldSize: number;
  private roadElements: THREE.Object3D[] = [];
  private decorations: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene, worldSize: number) {
    this.scene = scene;
    this.worldSize = worldSize;
    this.terrain = new THREE.Group();
    this.scene.add(this.terrain);
  }

  public createGround(): void {
    // Create a simpler ground with reduced detail
    const groundGeometry = new THREE.PlaneGeometry(this.worldSize * 2, this.worldSize * 2, 64, 64); // Reduced segments
    
    const positions = groundGeometry.attributes.position.array;
    const vertexCount = groundGeometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3);
    
    // Define colors for the terrain
    const grassColor = new THREE.Color(0x1a8f3c);
    const darkGrassColor = new THREE.Color(0x0a6e24);
    
    // Simplified terrain with less variation
    const frequency = 0.01;
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      
      // Create a simplex-like noise effect (simplified approximation)
      const noiseValue = this.simpleNoise(x * frequency, z * frequency);
      
      // Only apply small height variations outside the arena area
      const distFromCenter = Math.sqrt(x * x + z * z);
      const arenaRadius = this.worldSize * 0.4; // Arena boundary
      
      if (distFromCenter > arenaRadius) {
        // Apply height variation outside arena (reduced height variation)
        const heightFactor = (distFromCenter - arenaRadius) / arenaRadius;
        positions[i3 + 1] = noiseValue * 1.5 * heightFactor; // Reduced height multiplier
      }
      
      // Simpler color variation
      const colorValue = Math.abs(noiseValue);
      const color = new THREE.Color().lerpColors(
        grassColor, 
        darkGrassColor, 
        colorValue
      );
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    // Update geometry with new positions and colors
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeometry.computeVertexNormals(); // Recalculate normals after height change
    
    // Use MeshLambertMaterial instead of MeshStandardMaterial for better performance
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      vertexColors: true
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.terrain.add(ground);
    
    // Add decorative elements like trees
    this.addDecorations();
  }
  
  // Added road generation method referenced in World.ts
  public generateRoads(chunkX: number, chunkZ: number, chunkSize: number): void {
    // Simplified road generation for better performance
    const roadWidth = 10;
    const roadGroup = new THREE.Group();
    
    // Create a horizontal road with basic material
    const horizontalRoadGeometry = new THREE.PlaneGeometry(chunkSize, roadWidth, 10, 1); // Reduced segments
    const roadMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x333333,
    });
    
    const horizontalRoad = new THREE.Mesh(horizontalRoadGeometry, roadMaterial);
    horizontalRoad.rotation.x = -Math.PI / 2;
    horizontalRoad.position.set(chunkX, 0.05, chunkZ); // Slightly above ground
    roadGroup.add(horizontalRoad);
    
    // Create a vertical road that intersects the horizontal one
    const verticalRoadGeometry = new THREE.PlaneGeometry(roadWidth, chunkSize, 1, 10); // Reduced segments
    const verticalRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    verticalRoad.rotation.x = -Math.PI / 2;
    verticalRoad.position.set(chunkX, 0.05, chunkZ); // Slightly above ground
    roadGroup.add(verticalRoad);
    
    this.terrain.add(roadGroup);
    this.roadElements.push(roadGroup);
  }
  
  // Simple noise function that approximates simplex-like patterns without requiring imports
  private simpleNoise(x: number, z: number): number {
    // Get grid cell coordinates and fractional part
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const xf = x - xi;
    const zf = z - zi;
    
    // Get noise values for corners of the cell
    const n00 = this.dotProd(xi, zi, xf, zf);
    const n10 = this.dotProd(xi + 1, zi, xf - 1, zf);
    const n01 = this.dotProd(xi, zi + 1, xf, zf - 1);
    const n11 = this.dotProd(xi + 1, zi + 1, xf - 1, zf - 1);
    
    // Smooth interpolation
    const xs = this.fade(xf);
    const zs = this.fade(zf);
    
    // Interpolate
    return this.lerp(
      this.lerp(n00, n10, xs),
      this.lerp(n01, n11, xs),
      zs
    );
  }
  
  private permutation(x: number): number {
    // Simple hash function
    return ((x * 17 + 31) * 23) % 256;
  }
  
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  private dotProd(ix: number, iz: number, dx: number, dz: number): number {
    // Generate a gradient vector based on a hash of the coordinates
    const hash = this.permutation((ix + this.permutation(iz)) % 256);
    const h = hash & 3;
    
    // Generate a gradient direction
    let gx = h === 0 || h === 3 ? 1 : -1;
    let gz = h === 0 || h === 1 ? 1 : -1;
    
    // Dot product
    return gx * dx + gz * dz;
  }
  
  // Create a single helper method for basic terrain height
  public getTerrainHeight(x: number, z: number): number {
    const distFromCenter = Math.sqrt(x * x + z * z);
    const arenaRadius = this.worldSize * 0.4;
    
    if (distFromCenter > arenaRadius) {
      const heightFactor = (distFromCenter - arenaRadius) / arenaRadius;
      return this.simpleNoise(x * 0.01, z * 0.01) * 1.5 * heightFactor;
    }
    
    return 0;
  }
  
  public reset(): void {
    // Clear existing elements
    this.roadElements.forEach(road => {
      this.terrain.remove(road);
    });
    this.roadElements = [];
    
    this.decorations.forEach(decoration => {
      this.terrain.remove(decoration);
    });
    this.decorations = [];
    
    // Recreate terrain elements
    // Note: createGround() doesn't need to be called again as the main ground mesh stays the same
    
    // Regenerate roads - using arena size for proper positioning
    this.generateRoads(0, 0, this.worldSize * 0.4); // 0.4 is the arena size ratio used in getTerrainHeight
    
    // Add trees and other decorations
    this.addDecorations();
  }
  
  // New method to add decorative elements like trees
  private addDecorations(): void {
    // Add trees around the edges of the world
    const arenaRadius = this.worldSize * 0.4;
    const outerRadius = this.worldSize * 0.8;
    const numDecorations = 50; // Number of trees to add
    
    for (let i = 0; i < numDecorations; i++) {
      // Random angle and distance from center
      const angle = Math.random() * Math.PI * 2;
      const distance = arenaRadius + Math.random() * (outerRadius - arenaRadius);
      
      // Position based on angle and distance
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Get terrain height at this position
      const y = this.getTerrainHeight(x, z);
      
      // Create a tree - simple cone and cylinder
      const treeGroup = new THREE.Group();
      
      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 2, 6);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1;
      treeGroup.add(trunk);
      
      // Tree foliage - create 2-3 cones for a more interesting look
      const foliageLayers = 2 + Math.floor(Math.random() * 2);
      const foliageColor = new THREE.Color(0.0, 0.5 + Math.random() * 0.2, 0.0);
      
      for (let j = 0; j < foliageLayers; j++) {
        const coneHeight = 3 - j * 0.5;
        const coneRadius = 2 - j * 0.3;
        const foliageGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: foliageColor });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 2 + j * 1.5;
        treeGroup.add(foliage);
      }
      
      // Position the tree
      treeGroup.position.set(x, y, z);
      
      // Random rotation and slight scale variation
      treeGroup.rotation.y = Math.random() * Math.PI * 2;
      const scale = 0.8 + Math.random() * 0.4;
      treeGroup.scale.set(scale, scale, scale);
      
      // Add to scene and track
      this.terrain.add(treeGroup);
      this.decorations.push(treeGroup);
    }
  }
}