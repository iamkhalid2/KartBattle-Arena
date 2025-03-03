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
    // Create a more visually interesting floor pattern
    const floorGeometry = new THREE.PlaneGeometry(this.arenaSize, this.arenaSize, 32, 32); // Slightly increased segments for better pattern
    
    const vertexCount = floorGeometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3);
    
    // Define a more interesting color palette for the floor
    const primaryColor = new THREE.Color(0x222222); // Dark gray
    const secondaryColor = new THREE.Color(0x444444); // Medium gray
    const accentColor = new THREE.Color(0x0055aa); // Blue accent
    const highlightColor = new THREE.Color(0x007700); // Green highlight
    
    const positions = floorGeometry.attributes.position.array;
    
    // Create visually interesting floor pattern
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      
      // Normalized coordinates (-1 to 1)
      const nx = x / (this.arenaSize / 2);
      const nz = z / (this.arenaSize / 2);
      
      // Base color (default to primary color)
      let color = primaryColor;
      
      // Distance from center (for radial patterns)
      const distFromCenter = Math.sqrt(nx * nx + nz * nz);
      
      // Grid pattern with accent lines
      const gridSize = 20;
      const cellX = Math.floor((nx + 1) * this.arenaSize / gridSize / 2);
      const cellZ = Math.floor((nz + 1) * this.arenaSize / gridSize / 2);
      
      // Create checkerboard pattern
      if ((cellX + cellZ) % 2 === 0) {
        color = primaryColor;
      } else {
        color = secondaryColor;
      }
      
      // Add accent circular rings
      if (Math.abs(distFromCenter - 0.3) < 0.02 || Math.abs(distFromCenter - 0.6) < 0.01) {
        color = accentColor;
      }
      
      // Add cross pattern
      const absNx = Math.abs(nx);
      const absNz = Math.abs(nz);
      if (absNx < 0.03 || absNz < 0.03) {
        color = highlightColor;
      }
      
      // Apply color
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    floorGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create floor material with vertex colors
    const floorMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true
      // Removed shininess property as MeshLambertMaterial doesn't support it
    });
    
    this.arenaFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.arenaFloor.rotation.x = -Math.PI / 2;
    this.arenaFloor.position.y = 0;
    this.arenaFloor.receiveShadow = true;
    this.scene.add(this.arenaFloor);
  }
  
  private createWalls(): void {
    // Create visually interesting arena walls with stripes
    const wallHeight = 15;
    const wallThickness = 3;
    
    // Create a non-reflective material for the walls
    const wallColors = [
      0x0066cc, // Blue
      0x005599  // Darker blue
    ];
    
    // Calculate positions for the four walls
    const halfSize = this.arenaSize / 2;
    const wallPositions = [
      { pos: new THREE.Vector3(0, wallHeight/2, -halfSize - wallThickness/2), size: new THREE.Vector3(this.arenaSize, wallHeight, wallThickness), rotation: 0 },
      { pos: new THREE.Vector3(0, wallHeight/2, halfSize + wallThickness/2), size: new THREE.Vector3(this.arenaSize, wallHeight, wallThickness), rotation: 0 },
      { pos: new THREE.Vector3(-halfSize - wallThickness/2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.arenaSize), rotation: 0 },
      { pos: new THREE.Vector3(halfSize + wallThickness/2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.arenaSize), rotation: 0 }
    ];
    
    // Create and add the walls with stripes
    wallPositions.forEach((wall) => {
      // Create wall geometry with more segments for better detail
      const wallGeometry = new THREE.BoxGeometry(
        wall.size.x, 
        wall.size.y, 
        wall.size.z,
        Math.max(1, Math.floor(wall.size.x / 10)),
        5, // Vertical segments for stripes
        Math.max(1, Math.floor(wall.size.z / 10))
      );
      
      // Create colors for stripes
      const vertexCount = wallGeometry.attributes.position.count;
      const colors = new Float32Array(vertexCount * 3);
      const positions = wallGeometry.attributes.position.array;
      
      for (let i = 0; i < vertexCount; i++) {
        const i3 = i * 3;
        const y = positions[i3 + 1]; // Use y position for vertical stripes
        
        // Normalize Y position to 0-1 range
        const ny = (y + wall.size.y/2) / wall.size.y;
        
        // Create a striped pattern
        const stripeIndex = Math.floor(ny * 5) % 2;
        const color = new THREE.Color(wallColors[stripeIndex]);
        
        // Add a glowing stripe near the top
        if (ny > 0.85) {
          color.setHex(0x00aaff); // Bright blue accent at top
          color.multiplyScalar(1.5); // Make it brighter
        }
        
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
      }
      
      wallGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      // Create the wall with color details
      const wallMaterial = new THREE.MeshLambertMaterial({
        vertexColors: true
      });
      
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
    // Create more interesting corner structures
    const wallHeight = 15;
    const cornerSize = 10;
    
    // Create geometry for corner towers with more detail
    const baseGeometry = new THREE.CylinderGeometry(cornerSize, cornerSize * 1.2, wallHeight, 8); 
    
    // Define a gradient for the corners
    const cornerColors = [
      0x004488, // Dark blue at bottom
      0x0077cc, // Mid blue
      0x00aaff  // Light blue at top
    ];
    
    // Add color data to the geometry
    const vertexCount = baseGeometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3);
    const positions = baseGeometry.attributes.position.array;
    
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const y = positions[i3 + 1];
      
      // Normalize Y coordinate to 0-1 range
      const ny = (y + wallHeight/2) / wallHeight;
      
      let color;
      if (ny < 0.33) {
        color = new THREE.Color(cornerColors[0]);
      } else if (ny < 0.66) {
        color = new THREE.Color(cornerColors[1]);
      } else {
        color = new THREE.Color(cornerColors[2]);
      }
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    baseGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create material with vertex colors
    const cornerMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true
    });
    
    const halfSize = this.arenaSize / 2;
    const cornerPositions = [
      new THREE.Vector3(-halfSize, 0, -halfSize),
      new THREE.Vector3(halfSize, 0, -halfSize),
      new THREE.Vector3(-halfSize, 0, halfSize),
      new THREE.Vector3(halfSize, 0, halfSize)
    ];
    
    cornerPositions.forEach((pos) => {
      // Create base cylinder
      const base = new THREE.Mesh(baseGeometry, cornerMaterial);
      base.position.copy(pos);
      base.position.y = wallHeight / 2;
      base.castShadow = true;
      base.receiveShadow = true;
      this.scene.add(base);
      this.arenaElements.push(base);
      
      // Add a small glowing top cap for visual interest
      const capGeometry = new THREE.CylinderGeometry(cornerSize * 0.6, cornerSize, 2, 8);
      const capMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,  
        transparent: true,
        opacity: 0.7
      });
      
      const cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.copy(pos);
      cap.position.y = wallHeight + 1;
      this.scene.add(cap);
      this.arenaElements.push(cap);
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
    // Visually enhanced hazards
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
    
    // Using index in the forEach callback as it's required in the update method
    hazardPositions.forEach((pos) => {
      let hazardMesh;
      let glowMesh; // For optional glow effect
      
      if (pos.type === 'spike') {
        // Create a more detailed spike
        const geometry = new THREE.ConeGeometry(2, 4, 8);
        
        // Add color gradient to the spike
        const colors = new Float32Array(geometry.attributes.position.count * 3);
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < geometry.attributes.position.count; i++) {
          const i3 = i * 3;
          const y = positions[i3 + 1];
          // Create a gradient from red to yellow
          const t = (y + 2) / 4; // Normalize y to 0-1
          const color = new THREE.Color().setHSL(t * 0.1, 1, 0.5); // Red to orange
          
          colors[i3] = color.r;
          colors[i3 + 1] = color.g;
          colors[i3 + 2] = color.b;
        }
        
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.MeshLambertMaterial({ vertexColors: true });
        hazardMesh = new THREE.Mesh(geometry, material);
        hazardMesh.position.set(pos.x, 2, pos.z);
        
        // Add a subtle glow effect using a second mesh
        const glowGeometry = new THREE.ConeGeometry(2.2, 4.2, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xff3300, 
          transparent: true, 
          opacity: 0.3,
          depthWrite: false
        });
        glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.copy(hazardMesh.position);
      } 
      else if (pos.type === 'cylinder') {
        // Create a cool-looking energy cylinder
        const geometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
        
        // Add color to make it look like energy field
        const colors = new Float32Array(geometry.attributes.position.count * 3);
        for (let i = 0; i < geometry.attributes.position.count; i++) {
          const i3 = i * 3;
          const color = new THREE.Color().setHSL((i % 20) / 20, 0.8, 0.5); // Rainbow effect
          
          colors[i3] = color.r;
          colors[i3 + 1] = color.g;
          colors[i3 + 2] = color.b;
        }
        
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.MeshLambertMaterial({ vertexColors: true });
        hazardMesh = new THREE.Mesh(geometry, material);
        hazardMesh.position.set(pos.x, 1.5, pos.z);
      }
      else if (pos.type === 'barrier') {
        // Create a more interesting barrier with stripes
        const geometry = new THREE.BoxGeometry(10, 2, 2, 10, 1, 1);
        
        // Add warning stripes
        const colors = new Float32Array(geometry.attributes.position.count * 3);
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < geometry.attributes.position.count; i++) {
          const i3 = i * 3;
          const x = positions[i3];
          
          // Normalize x position for striping
          const nx = (x + 5) / 10;
          const stripeWidth = 0.2;
          const isInYellowStripe = (nx % stripeWidth) < (stripeWidth / 2);
          
          const color = isInYellowStripe ? 
            new THREE.Color(0xffcc00) : // Yellow stripe
            new THREE.Color(0x222222);  // Black stripe
          
          colors[i3] = color.r;
          colors[i3 + 1] = color.g;
          colors[i3 + 2] = color.b;
        }
        
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.MeshLambertMaterial({ vertexColors: true });
        hazardMesh = new THREE.Mesh(geometry, material);
        hazardMesh.position.set(pos.x, 1, pos.z);
      }
      
      if (hazardMesh) {
        hazardMesh.castShadow = true;
        hazardMesh.name = pos.type;
        
        // Store the position index as a property for use in the update method
        hazardMesh.userData = {
          ...hazardMesh.userData,
          positionIndex: hazardPositions.indexOf(pos) // Store index for use in update
        };
        
        this.scene.add(hazardMesh);
        this.hazardObjects.push(hazardMesh);
        
        // Add the glow mesh if created
        if (glowMesh) {
          this.scene.add(glowMesh);
          this.hazardObjects.push(glowMesh);
        }
      }
    });
  }
  
  public update(deltaTime: number): void {
    // More interesting animations but still optimized
    this.time += deltaTime;
    
    // Update hazard objects with more interesting effects
    this.hazardObjects.forEach((hazard) => {
      if (hazard instanceof THREE.Mesh) {
        if (hazard.name === 'cylinder') {
          // Get the index from userData for animation offset
          const index = hazard.userData?.positionIndex || 0;
          
          // Floating animation
          hazard.position.y = 1.5 + Math.sin(this.time * 2 + index) * 0.2;
          
          // Rotate the energy cylinders
          hazard.rotation.y += deltaTime * (index % 2 === 0 ? 1 : -1);
        }
        else if (hazard.name === 'spike' && hazard.material instanceof THREE.MeshLambertMaterial) {
          // Subtle pulsing effect by rotating hue
          if (hazard.material.vertexColors) {
            const colors = hazard.geometry.attributes.color.array;
            for (let i = 0; i < colors.length; i += 3) {
              const color = new THREE.Color(colors[i], colors[i + 1], colors[i + 2]);
              color.offsetHSL(deltaTime * 0.1, 0, 0);
              colors[i] = color.r;
              colors[i + 1] = color.g;
              colors[i + 2] = color.b;
            }
            hazard.geometry.attributes.color.needsUpdate = true;
          }
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
