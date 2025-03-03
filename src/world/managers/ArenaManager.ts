import * as THREE from 'three';

export class ArenaManager {
  private scene: THREE.Scene;
  private arenaSize: number;
  private arenaWalls: THREE.Mesh[] = [];
  private arenaFloor: THREE.Mesh;
  private arenaElements: THREE.Object3D[] = [];
  private hazardObjects: THREE.Object3D[] = [];
  private time: number = 0;
  private sponsorMaterials: THREE.Material[] = [];
  
  constructor(scene: THREE.Scene, arenaSize: number) {
    this.scene = scene;
    this.arenaSize = arenaSize;
    this.arenaFloor = new THREE.Mesh(); // Initialize to avoid undefined
  }

  public async createArena(): Promise<void> {
    this.createFloor();
    this.createWalls();
    this.createCorners();
    // Removed decorative elements for better performance
    this.addHazardElements();
    // Reduced complexity of sponsorships
    await this.addSponsorship();
  }

  private createFloor(): void {
    // Create a more performance-friendly arena floor
    const floorGeometry = new THREE.PlaneGeometry(this.arenaSize, this.arenaSize, 16, 16); // Reduced segments
    
    // Create vertex colors for the floor with simplified pattern
    const vertexCount = floorGeometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3);
    
    // Define colors for the floor pattern
    const primaryColor = new THREE.Color(0x2a2a2a); // Dark gray
    const secondaryColor = new THREE.Color(0x3a3a3a); // Slightly lighter gray
    
    const positions = floorGeometry.attributes.position.array;
    
    // Create a simplified grid pattern
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      
      // Normalized coordinates (-1 to 1)
      const nx = x / (this.arenaSize / 2);
      const nz = z / (this.arenaSize / 2);
      
      // Create color based on position
      let color;
      
      // Create simpler grid pattern
      const gridSize = 10;
      const cellX = Math.floor((nx + 1) * this.arenaSize / gridSize / 2);
      const cellZ = Math.floor((nz + 1) * this.arenaSize / gridSize / 2);
      
      if ((cellX + cellZ) % 2 === 0) {
        color = primaryColor;
      } else {
        color = secondaryColor;
      }
      
      // Apply color
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    floorGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create floor material with vertex colors but no reflections
    const floorMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true
    });
    
    this.arenaFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.arenaFloor.rotation.x = -Math.PI / 2;
    this.arenaFloor.position.y = 0;
    this.arenaFloor.receiveShadow = true;
    this.scene.add(this.arenaFloor);
  }
  
  private createWalls(): void {
    // Create simpler arena walls
    const wallHeight = 15;
    const wallThickness = 3;
    
    // Create a non-reflective material for the walls
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x0077dd,
    });
    
    // Calculate positions for the four walls
    const halfSize = this.arenaSize / 2;
    const wallPositions = [
      { pos: new THREE.Vector3(0, wallHeight/2, -halfSize - wallThickness/2), size: new THREE.Vector3(this.arenaSize, wallHeight, wallThickness), rotation: 0 },
      { pos: new THREE.Vector3(0, wallHeight/2, halfSize + wallThickness/2), size: new THREE.Vector3(this.arenaSize, wallHeight, wallThickness), rotation: 0 },
      { pos: new THREE.Vector3(-halfSize - wallThickness/2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.arenaSize), rotation: 0 },
      { pos: new THREE.Vector3(halfSize + wallThickness/2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.arenaSize), rotation: 0 }
    ];
    
    // Create and add the walls with simplified geometry
    wallPositions.forEach((wall) => {
      // Create basic wall geometry
      const wallGeometry = new THREE.BoxGeometry(wall.size.x, wall.size.y, wall.size.z);
      
      // Create the wall with basic geometry
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.copy(wall.pos);
      wallMesh.rotation.y = wall.rotation;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      
      this.scene.add(wallMesh);
      this.arenaWalls.push(wallMesh);
    });
  }
  
  private createCorners(): void {
    // Create simplified corner structures
    const wallHeight = 15;
    const cornerSize = 10;
    
    // Create geometry for corner towers
    const baseGeometry = new THREE.CylinderGeometry(cornerSize, cornerSize, wallHeight, 8); // Reduced segments
    
    // Create simple materials for the corners
    const cornerMaterial = new THREE.MeshLambertMaterial({
      color: 0x0099ff
    });
    
    const halfSize = this.arenaSize / 2;
    const cornerPositions = [
      new THREE.Vector3(-halfSize, 0, -halfSize),
      new THREE.Vector3(halfSize, 0, -halfSize),
      new THREE.Vector3(-halfSize, 0, halfSize),
      new THREE.Vector3(halfSize, 0, halfSize)
    ];
    
    cornerPositions.forEach(pos => {
      // Create base cylinder
      const base = new THREE.Mesh(baseGeometry, cornerMaterial);
      base.position.copy(pos);
      base.position.y = wallHeight / 2;
      base.castShadow = true;
      base.receiveShadow = true;
      this.scene.add(base);
      this.arenaElements.push(base);
    });
  }
  
  private async addSponsorship(): Promise<void> {
    // Simplified sponsorship, no reflective materials
    const halfSize = this.arenaSize / 2;
    const wallHeight = 15;
    
    try {
      const loader = new THREE.TextureLoader();
      const texture = await new Promise<THREE.Texture>((resolve) => {
        loader.load('./public/sponsors/bustan.svg', resolve);
      });
      
      const sponsorMaterial = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true
      });
      
      // Create simpler sponsor panel
      const panelGeometry = new THREE.PlaneGeometry(10, 5);
      const panel = new THREE.Mesh(panelGeometry, sponsorMaterial);
      panel.position.set(0, wallHeight/2, -halfSize + 0.5);
      panel.rotation.y = Math.PI;
      
      this.scene.add(panel);
      this.arenaElements.push(panel);
      this.sponsorMaterials.push(sponsorMaterial);
      
    } catch (error) {
      console.error('Error loading sponsor texture:', error);
    }
  }
  
  private addHazardElements(): void {
    // Simplified hazards with basic materials
    const hazardPositions = [
      { x: -20, z: -20, type: 'spike' },
      { x: 20, z: 20, type: 'spike' },
      { x: -20, z: 20, type: 'cylinder' },
      { x: 20, z: -20, type: 'cylinder' },
      { x: 0, z: -30, type: 'barrier' },
      { x: 0, z: 30, type: 'barrier' },
      { x: -30, z: 0, type: 'barrier' },
      { x: 30, z: 0, type: 'barrier' }
    ];
    
    hazardPositions.forEach(pos => {
      let hazardMesh;
      
      if (pos.type === 'spike') {
        const geometry = new THREE.ConeGeometry(2, 4, 6); // Reduced segments
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        hazardMesh = new THREE.Mesh(geometry, material);
        hazardMesh.position.set(pos.x, 2, pos.z);
      } 
      else if (pos.type === 'cylinder') {
        const geometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 8); // Reduced segments
        const material = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        hazardMesh = new THREE.Mesh(geometry, material);
        hazardMesh.position.set(pos.x, 1.5, pos.z);
      }
      else if (pos.type === 'barrier') {
        const geometry = new THREE.BoxGeometry(10, 2, 2);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        hazardMesh = new THREE.Mesh(geometry, material);
        hazardMesh.position.set(pos.x, 1, pos.z);
      }
      
      if (hazardMesh) {
        hazardMesh.castShadow = true;
        hazardMesh.name = pos.type;
        this.scene.add(hazardMesh);
        this.hazardObjects.push(hazardMesh);
      }
    });
  }
  
  public update(deltaTime: number): void {
    // Minimized animations for better performance
    this.time += deltaTime;
    
    // Only update hazard positions, no animations for emissive or other effects
    this.hazardObjects.forEach((hazard, index) => {
      if (hazard instanceof THREE.Mesh) {
        if (hazard.name === 'cylinder') {
          // Simple vertical movement only
          hazard.position.y = 1.5 + Math.sin(this.time * 2 + index) * 0.2;
        }
      }
    });
  }
  
  public checkCollisions(collider: THREE.Box3): boolean {
    // Check collisions with arena walls
    for (const wall of this.arenaWalls) {
      const wallBoundingBox = new THREE.Box3().setFromObject(wall);
      if (collider.intersectsBox(wallBoundingBox)) {
        return true;
      }
    }
    
    // Check collisions with hazard objects
    for (const hazard of this.hazardObjects) {
      const hazardBoundingBox = new THREE.Box3().setFromObject(hazard);
      if (collider.intersectsBox(hazardBoundingBox)) {
        return true;
      }
    }
    
    return false;
  }
  
  public getHazardObjects(): THREE.Object3D[] {
    return this.hazardObjects;
  }

  public reset(): void {
    // Clear existing elements
    this.arenaElements.forEach(element => {
      this.scene.remove(element);
    });
    this.arenaElements = [];
    
    this.hazardObjects.forEach(object => {
      this.scene.remove(object);
    });
    this.hazardObjects = [];
    
    // Recreate arena
    this.createArena();
  }
}
