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
    this.terrain = new THREE.Object3D();
    this.scene.add(this.terrain);
  }

  public createGround(): void {
    // Create a more interesting ground with variation and detail
    // Base ground plane that covers the entire world
    const groundSize = this.worldSize * 2;
    const resolution = 128; // Higher resolution for the ground plane
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, resolution, resolution);
    
    // Create a more interesting ground material with vertex colors
    const vertexCount = groundGeometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3);
    
    // Base colors for different terrain types
    const grassColor = new THREE.Color(0x2e8b57); // Sea green
    const darkGrassColor = new THREE.Color(0x1e6b37); // Darker green
    
    // Add subtle height variation to the ground
    const positions = groundGeometry.attributes.position.array;
    
    // Use simplex-like noise pattern for terrain
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      
      // Create a simplex-like noise effect (simplified approximation)
      const frequency = 0.01;
      const noiseValue = this.simpleNoise(x * frequency, z * frequency);
      
      // Only apply small height variations outside the arena area
      const distFromCenter = Math.sqrt(x * x + z * z);
      const arenaRadius = this.worldSize * 0.4; // Arena boundary
      
      if (distFromCenter > arenaRadius) {
        // Apply height variation outside arena
        const heightFactor = (distFromCenter - arenaRadius) / arenaRadius;
        positions[i3 + 1] = noiseValue * 2 * heightFactor;
      }
      
      // Set colors based on noise and distance from center
      const colorNoise = this.simpleNoise(x * frequency * 2, z * frequency * 2);
      const colorValue = Math.abs(colorNoise);
      
      const color = new THREE.Color().lerpColors(
        grassColor, 
        darkGrassColor, 
        colorValue
      );
      
      // Add variation to make it look more natural
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    // Update geometry with new positions and colors
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeometry.computeVertexNormals(); // Recalculate normals after height change
    
    // Create material with vertex colors for the varied terrain
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: false // Set to true for a more stylized look
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.terrain.add(ground);
    
    // Add terrain decorations
    this.addTerrainDecorations();
  }
  
  // Simple noise function that approximates simplex-like patterns without requiring imports
  private simpleNoise(x: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Z = Math.floor(z) & 255;
    
    const xf = x - Math.floor(x);
    const zf = z - Math.floor(z);
    
    const u = this.fade(xf);
    const v = this.fade(zf);
    
    const A = this.permutation(X) + Z;
    const B = this.permutation(X + 1) + Z;
    
    return this.lerp(
      this.lerp(this.gradient(this.permutation(A), xf, zf), this.gradient(this.permutation(B), xf - 1, zf), u),
      this.lerp(this.gradient(this.permutation(A + 1), xf, zf - 1), this.gradient(this.permutation(B + 1), xf - 1, zf - 1), u),
      v
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
  
  private gradient(hash: number, x: number, z: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : z;
    const v = h < 4 ? z : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  
  public addTerrainDecorations(): void {
    // Clear previous decorations
    this.decorations.forEach(decoration => {
      this.terrain.remove(decoration);
    });
    this.decorations = [];
    
    const decorationGroup = new THREE.Group();
    
    // Add rocks
    this.addRocks(decorationGroup);
    
    // Add grass tufts
    this.addGrassTufts(decorationGroup);
    
    this.terrain.add(decorationGroup);
    this.decorations.push(decorationGroup);
  }
  
  private addRocks(group: THREE.Group): void {
    // Add some scattered rocks on the terrain
    const rockCount = 50;
    const rockGeometries = [
      new THREE.DodecahedronGeometry(1, 0), // Basic rock shape
      new THREE.DodecahedronGeometry(1, 1), // More detailed rock
      new THREE.OctahedronGeometry(1, 0)    // Another rock variation
    ];
    
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a7a7a,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    for (let i = 0; i < rockCount; i++) {
      const geometryIndex = Math.floor(Math.random() * rockGeometries.length);
      const rock = new THREE.Mesh(rockGeometries[geometryIndex], rockMaterial);
      
      // Randomize size
      const scale = 0.5 + Math.random() * 1.5;
      rock.scale.set(scale, scale * (0.7 + Math.random() * 0.6), scale);
      
      // Randomize rotation
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Position outside arena area
      const arenaRadius = this.worldSize * 0.4;
      const minRadius = arenaRadius + 10;
      const maxRadius = this.worldSize - 20;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const angle = Math.random() * Math.PI * 2;
      
      rock.position.set(
        Math.cos(angle) * radius,
        0, // Will be adjusted to terrain height
        Math.sin(angle) * radius
      );
      
      // Adjust height to terrain
      const noiseValue = this.simpleNoise(rock.position.x * 0.01, rock.position.z * 0.01);
      rock.position.y = noiseValue * 2 + scale / 2;
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      
      group.add(rock);
    }
  }
  
  private addGrassTufts(group: THREE.Group): void {
    // Add small grass tufts for detail
    const grassCount = 200;
    const grassGeometry = new THREE.ConeGeometry(0.5, 1.5, 4, 1);
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x4CBB17, // Kelly green
      flatShading: true
    });
    
    for (let i = 0; i < grassCount; i++) {
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      
      // Randomize size
      const scale = 0.3 + Math.random() * 0.7;
      grass.scale.set(scale, scale * (1.0 + Math.random() * 0.5), scale);
      
      // Randomize rotation but keep upright
      grass.rotation.y = Math.random() * Math.PI * 2;
      grass.rotation.x = (Math.random() - 0.5) * 0.2;
      grass.rotation.z = (Math.random() - 0.5) * 0.2;
      
      // Position outside arena area but within world
      const arenaRadius = this.worldSize * 0.4;
      const minRadius = arenaRadius + 5;
      const maxRadius = this.worldSize - 10;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const angle = Math.random() * Math.PI * 2;
      
      grass.position.set(
        Math.cos(angle) * radius,
        0, // Will be adjusted to terrain height
        Math.sin(angle) * radius
      );
      
      // Adjust height to terrain
      const noiseValue = this.simpleNoise(grass.position.x * 0.01, grass.position.z * 0.01);
      grass.position.y = noiseValue * 2 + 0.75 * scale;
      
      grass.castShadow = true;
      group.add(grass);
    }
  }

  public generateRoads(chunkX: number, chunkZ: number, chunkSize: number): void {
    const roadWidth = 10;
    const roadGroup = new THREE.Group();
    
    // Create a horizontal road with more detailed materials
    const horizontalRoadGeometry = new THREE.PlaneGeometry(chunkSize, roadWidth, 20, 2);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.3
    });
    
    const horizontalRoad = new THREE.Mesh(horizontalRoadGeometry, roadMaterial);
    horizontalRoad.rotation.x = -Math.PI / 2;
    horizontalRoad.position.set(chunkX, 0.05, chunkZ); // Slightly above ground
    roadGroup.add(horizontalRoad);
    
    // Create a vertical road that intersects the horizontal one
    const verticalRoadGeometry = new THREE.PlaneGeometry(roadWidth, chunkSize, 2, 20);
    const verticalRoad = new THREE.Mesh(verticalRoadGeometry, roadMaterial);
    verticalRoad.rotation.x = -Math.PI / 2;
    verticalRoad.position.set(chunkX, 0.05, chunkZ); // Slightly above ground
    roadGroup.add(verticalRoad);
    
    // Add road markings - center white dashed lines
    this.addRoadMarkings(roadGroup, chunkX, chunkZ, chunkSize);
    
    // Add asphalt texture through vertex color variation
    this.addAsphaltTextureVariation(horizontalRoadGeometry);
    this.addAsphaltTextureVariation(verticalRoadGeometry);
    
    this.terrain.add(roadGroup);
    this.roadElements.push(roadGroup);
  }
  
  private addAsphaltTextureVariation(geometry: THREE.PlaneGeometry): void {
    // Add subtle color variations to make asphalt look more realistic
    const positions = geometry.attributes.position.array;
    const count = geometry.attributes.position.count;
    
    // Create color attribute
    const colors = new Float32Array(count * 3);
    
    // Base asphalt color
    const asphaltColor = new THREE.Color(0x333333);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      
      // Add noise variation to color
      const noise = this.simpleNoise(x * 0.2, z * 0.2) * 0.08; // Subtle variation
      
      const color = new THREE.Color().copy(asphaltColor);
      color.r += noise;
      color.g += noise;
      color.b += noise;
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // Update the material to use vertex colors
    const material = (geometry as any).material;
    if (material) material.vertexColors = true;
  }
  
  private addRoadMarkings(roadGroup: THREE.Group, chunkX: number, chunkZ: number, chunkSize: number): void {
    const dashLength = 3;
    const dashGap = 3;
    const numDashes = Math.floor(chunkSize / (dashLength + dashGap));
    // Using MeshLambertMaterial which doesn't require emissive properties
    const lineMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff,
      emissiveIntensity: 0.2
    });
    
    // Horizontal road markings
    for (let i = 0; i < numDashes; i++) {
      const lineGeometry = new THREE.PlaneGeometry(dashLength, 0.3);
      const dash = new THREE.Mesh(lineGeometry, lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(
        chunkX - chunkSize/2 + i * (dashLength + dashGap) + dashLength/2,
        0.1, // Slightly above road
        chunkZ
      );
      roadGroup.add(dash);
    }
    
    // Vertical road markings
    for (let i = 0; i < numDashes; i++) {
      const lineGeometry = new THREE.PlaneGeometry(0.3, dashLength);
      const dash = new THREE.Mesh(lineGeometry, lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(
        chunkX,
        0.1, // Slightly above road
        chunkZ - chunkSize/2 + i * (dashLength + dashGap) + dashLength/2
      );
      roadGroup.add(dash);
    }
    
    // Add road edges for more detail
    this.addRoadEdges(roadGroup, chunkX, chunkZ, chunkSize);
  }
  
  private addRoadEdges(roadGroup: THREE.Group, chunkX: number, chunkZ: number, chunkSize: number): void {
    const roadWidth = 10;
    const edgeWidth = 0.5;
    const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    
    // Horizontal road edges
    const horizontalEdgeGeometry1 = new THREE.PlaneGeometry(chunkSize, edgeWidth);
    const horizontalEdge1 = new THREE.Mesh(horizontalEdgeGeometry1, edgeMaterial);
    horizontalEdge1.rotation.x = -Math.PI / 2;
    horizontalEdge1.position.set(chunkX, 0.11, chunkZ - roadWidth/2);
    
    const horizontalEdgeGeometry2 = new THREE.PlaneGeometry(chunkSize, edgeWidth);
    const horizontalEdge2 = new THREE.Mesh(horizontalEdgeGeometry2, edgeMaterial);
    horizontalEdge2.rotation.x = -Math.PI / 2;
    horizontalEdge2.position.set(chunkX, 0.11, chunkZ + roadWidth/2);
    
    // Vertical road edges
    const verticalEdgeGeometry1 = new THREE.PlaneGeometry(edgeWidth, chunkSize);
    const verticalEdge1 = new THREE.Mesh(verticalEdgeGeometry1, edgeMaterial);
    verticalEdge1.rotation.x = -Math.PI / 2;
    verticalEdge1.position.set(chunkX - roadWidth/2, 0.11, chunkZ);
    
    const verticalEdgeGeometry2 = new THREE.PlaneGeometry(edgeWidth, chunkSize);
    const verticalEdge2 = new THREE.Mesh(verticalEdgeGeometry2, edgeMaterial);
    verticalEdge2.rotation.x = -Math.PI / 2;
    verticalEdge2.position.set(chunkX + roadWidth/2, 0.11, chunkZ);
    
    roadGroup.add(horizontalEdge1);
    roadGroup.add(horizontalEdge2);
    roadGroup.add(verticalEdge1);
    roadGroup.add(verticalEdge2);
  }
  
  public getTerrainHeight(x: number, z: number): number {
    // Return terrain height based on noise function
    // Only apply to areas outside the arena
    const distFromCenter = Math.sqrt(x * x + z * z);
    const arenaRadius = this.worldSize * 0.4;
    
    if (distFromCenter > arenaRadius) {
      const heightFactor = (distFromCenter - arenaRadius) / arenaRadius;
      const noiseValue = this.simpleNoise(x * 0.01, z * 0.01);
      return noiseValue * 2 * heightFactor;
    }
    
    // Inside arena, terrain is flat
    return 0;
  }
  
  public getRoadWidth(): number {
    return 10; // Standard road width
  }
  
  public reset(): void {
    // Remove all road elements
    this.roadElements.forEach(element => {
      this.terrain.remove(element);
    });
    this.roadElements = [];
    
    // Remove all decorations
    this.decorations.forEach(decoration => {
      this.terrain.remove(decoration);
    });
    this.decorations = [];
  }
}