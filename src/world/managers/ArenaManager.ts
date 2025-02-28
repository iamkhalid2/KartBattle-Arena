import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Font } from 'three/addons/loaders/FontLoader.js';

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
    this.addArenaDecoration();
    this.addHazardElements();
    await this.addSponsorship();
  }
  
  private createFloor(): void {
    // Create a more interesting arena floor with detailed pattern
    const floorGeometry = new THREE.PlaneGeometry(this.arenaSize, this.arenaSize, 32, 32);
    
    // Create vertex colors for the floor to add visual interest
    const vertexCount = floorGeometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3);
    
    // Define colors for the floor pattern
    const primaryColor = new THREE.Color(0x2a2a2a); // Dark gray
    const secondaryColor = new THREE.Color(0x3a3a3a); // Slightly lighter gray
    const accentColor = new THREE.Color(0x0066cc); // Blue accent
    
    const positions = floorGeometry.attributes.position.array;
    
    // Create a grid pattern with accent lines
    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      
      // Normalized coordinates (-1 to 1)
      const nx = x / (this.arenaSize / 2);
      const nz = z / (this.arenaSize / 2);
      
      // Create color based on position
      let color;
      
      // Create grid pattern
      const gridSize = 10;
      const gridX = Math.abs(Math.sin(nx * Math.PI * this.arenaSize / gridSize));
      const gridZ = Math.abs(Math.sin(nz * Math.PI * this.arenaSize / gridSize));
      
      if (gridX < 0.05 || gridZ < 0.05) {
        // Grid lines
        color = accentColor;
      } else {
        // Alternate grid cells
        const cellX = Math.floor((nx + 1) * this.arenaSize / gridSize / 2);
        const cellZ = Math.floor((nz + 1) * this.arenaSize / gridSize / 2);
        
        if ((cellX + cellZ) % 2 === 0) {
          color = primaryColor;
        } else {
          color = secondaryColor;
        }
      }
      
      // Add a circular pattern in the center
      const distFromCenter = Math.sqrt(nx * nx + nz * nz);
      const circleRadius = 0.5; // Size of center circle relative to arena
      
      if (distFromCenter < circleRadius) {
        // Create concentric circles
        const circlePattern = Math.abs(Math.sin(distFromCenter * Math.PI * 10));
        
        if (circlePattern < 0.1) {
          color = accentColor;
        } else if (distFromCenter < 0.1) {
          // Center logo/accent
          color = new THREE.Color(0xff3300); // Orange/red center
        }
      }
      
      // Apply color
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    floorGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create floor material with vertex colors
    const floorMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.3,
    });
    
    this.arenaFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.arenaFloor.rotation.x = -Math.PI / 2;
    this.arenaFloor.position.y = 0;
    this.arenaFloor.receiveShadow = true;
    this.scene.add(this.arenaFloor);
  }
  
  private createWalls(): void {
    // Create more interesting arena walls with patterns and details
    const wallHeight = 15;
    const wallThickness = 3;
    
    // Create a more interesting material for the walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0077dd,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.7
    });
    
    // Calculate positions for the four walls
    const halfSize = this.arenaSize / 2;
    const wallPositions = [
      { pos: new THREE.Vector3(0, wallHeight/2, -halfSize - wallThickness/2), size: new THREE.Vector3(this.arenaSize, wallHeight, wallThickness), rotation: 0 },
      { pos: new THREE.Vector3(0, wallHeight/2, halfSize + wallThickness/2), size: new THREE.Vector3(this.arenaSize, wallHeight, wallThickness), rotation: 0 },
      { pos: new THREE.Vector3(-halfSize - wallThickness/2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.arenaSize), rotation: 0 },
      { pos: new THREE.Vector3(halfSize + wallThickness/2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.arenaSize), rotation: 0 }
    ];
    
    // Create and add the walls with improved geometry
    wallPositions.forEach((wall, index) => {
      // Create segmented wall geometry for more interesting look
      const segments = 10;
      const wallGeometry = new THREE.BoxGeometry(wall.size.x, wall.size.y, wall.size.z, segments, 1, 1);
      
      // Modify vertices to create a more interesting wall shape
      const positions = wallGeometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        // Only modify y-position (height) of vertices
        if (positions[i + 1] > 0) { // Only top half of wall
          const x = positions[i]; // x position relative to wall center
          
          // Create wave pattern along wall
          const normalizedX = x / (wall.size.x / 2); // -1 to 1
          const waveHeight = 2 * Math.sin(normalizedX * Math.PI * 2);
          
          // Apply wave pattern to top of wall
          positions[i + 1] += waveHeight;
        }
      }
      
      wallGeometry.attributes.position.needsUpdate = true;
      wallGeometry.computeVertexNormals();
      
      // Create the wall with custom geometry
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.copy(wall.pos);
      wallMesh.rotation.y = wall.rotation;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      
      this.scene.add(wallMesh);
      this.arenaWalls.push(wallMesh);
      
      // Add decorative light strips to the walls
      this.addWallLightStrips(wallMesh, wall.size, index);
    });
  }
  
  private addWallLightStrips(wall: THREE.Mesh, size: THREE.Vector3, wallIndex: number): void {
    // Add glowing light strips to the walls - Switch to MeshStandardMaterial for emissive properties
    const stripHeight = 0.5;
    const stripDepth = 0.2;
    const stripMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1
    });
    
    // Determine strip orientation based on wall index
    let stripGeometry;
    let stripPosition = new THREE.Vector3();
    
    if (wallIndex < 2) { // North/South walls
      stripGeometry = new THREE.BoxGeometry(size.x * 0.95, stripHeight, stripDepth);
      stripPosition.copy(wall.position);
      stripPosition.z += wallIndex === 0 ? size.z / 2 + 0.1 : -size.z / 2 - 0.1;
      stripPosition.y = size.y * 0.8; // Place strip near top of wall
    } else { // East/West walls
      stripGeometry = new THREE.BoxGeometry(stripDepth, stripHeight, size.z * 0.95);
      stripPosition.copy(wall.position);
      stripPosition.x += wallIndex === 2 ? size.x / 2 + 0.1 : -size.x / 2 - 0.1;
      stripPosition.y = size.y * 0.8; // Place strip near top of wall
    }
    
    const lightStrip = new THREE.Mesh(stripGeometry, stripMaterial);
    lightStrip.position.copy(stripPosition);
    this.scene.add(lightStrip);
    this.arenaElements.push(lightStrip);
  }
  
  private createCorners(): void {
    // Create more elaborate corner structures
    const wallHeight = 15;
    const cornerSize = 10;
    
    // Create geometry for corner towers
    const baseGeometry = new THREE.CylinderGeometry(cornerSize, cornerSize * 1.2, wallHeight, 16);
    const topGeometry = new THREE.ConeGeometry(cornerSize, cornerSize/2, 16);
    
    // Create interesting materials for the corners
    const cornerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      roughness: 0.2,
      metalness: 0.8
    });
    
    // Switch to MeshStandardMaterial for the glow material
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.7
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
      
      // Create top cone
      const top = new THREE.Mesh(topGeometry, cornerMaterial);
      top.position.copy(pos);
      top.position.y = wallHeight + cornerSize/4;
      top.castShadow = true;
      top.receiveShadow = true;
      this.scene.add(top);
      this.arenaElements.push(top);
      
      // Add glowing orb on top
      const orbGeometry = new THREE.SphereGeometry(cornerSize/4, 16, 16);
      const orb = new THREE.Mesh(orbGeometry, glowMaterial);
      orb.position.copy(pos);
      orb.position.y = wallHeight + cornerSize/2 + cornerSize/4;
      this.scene.add(orb);
      this.arenaElements.push(orb);
      
      // Add a light source at the orb position
      const pointLight = new THREE.PointLight(0x00ffff, 0.8, 50);
      pointLight.position.copy(orb.position);
      this.scene.add(pointLight);
      this.arenaElements.push(pointLight);
    });
  }
  
  private addArenaDecoration(): void {
    // Add decorative elements to make the arena more interesting
    
    // Create central platform/altar
    const platformRadius = this.arenaSize * 0.1;
    const platformHeight = 1;
    const platformGeometry = new THREE.CylinderGeometry(platformRadius, platformRadius * 1.2, platformHeight, 16);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.7
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, platformHeight/2, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.scene.add(platform);
    this.arenaElements.push(platform);
    
    // Add platform details - central pillar
    const pillarGeometry = new THREE.CylinderGeometry(platformRadius * 0.2, platformRadius * 0.2, platformHeight * 4, 8);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088cc,
      roughness: 0.3,
      metalness: 0.8
    });
    
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(0, platformHeight * 2.5, 0);
    pillar.castShadow = true;
    this.scene.add(pillar);
    this.arenaElements.push(pillar);
    
    // Add energy orb on top of pillar - switch to MeshStandardMaterial
    const orbGeometry = new THREE.SphereGeometry(platformRadius * 0.4, 16, 16);
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff3300,
      emissiveIntensity: 1
    });
    
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(0, platformHeight * 4.5, 0);
    this.scene.add(orb);
    this.arenaElements.push(orb);
    
    // Add light from the orb
    const orbLight = new THREE.PointLight(0xff3300, 1, 50);
    orbLight.position.copy(orb.position);
    this.scene.add(orbLight);
    this.arenaElements.push(orbLight);
    
    // Add decorative boundary markers
    this.addBoundaryMarkers();
  }
  
  private addBoundaryMarkers(): void {
    // Add markers around the arena boundary for visual interest
    const halfSize = this.arenaSize / 2;
    const markerCount = 16; // Number of markers around perimeter
    const markerSize = 2;
    const markerHeight = 3;
    
    const markerGeometry = new THREE.BoxGeometry(markerSize, markerHeight, markerSize);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088cc,
      roughness: 0.3,
      metalness: 0.8
    });
    
    // Place markers around the perimeter
    for (let i = 0; i < markerCount; i++) {
      const angle = (i / markerCount) * Math.PI * 2;
      const x = Math.sin(angle) * (halfSize - markerSize);
      const z = Math.cos(angle) * (halfSize - markerSize);
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, markerHeight/2, z);
      marker.castShadow = true;
      marker.receiveShadow = true;
      
      // Add a light to the marker
      const markerLight = new THREE.PointLight(0x0088cc, 0.3, 10);
      markerLight.position.set(x, markerHeight, z);
      
      this.scene.add(marker);
      this.scene.add(markerLight);
      this.arenaElements.push(marker);
      this.arenaElements.push(markerLight);
    }
  }
  
  private addHazardElements(): void {
    // Add hazard objects like bouncy barriers or obstacles
    const obstacleCount = 6;
    const halfSize = this.arenaSize / 2;
    const safeRadius = this.arenaSize * 0.15; // Keep center clear
    
    // Create different obstacle types
    const obstacles = [
      {
        geometry: new THREE.BoxGeometry(4, 2, 4),
        material: new THREE.MeshStandardMaterial({
          color: 0xff4400,
          roughness: 0.3,
          metalness: 0.7
        }),
        name: 'barrier'
      },
      {
        geometry: new THREE.CylinderGeometry(2, 2, 2, 8),
        material: new THREE.MeshStandardMaterial({
          color: 0xff8800,
          roughness: 0.4,
          metalness: 0.6
        }),
        name: 'cylinder'
      },
      {
        geometry: new THREE.TetrahedronGeometry(2.5, 0),
        material: new THREE.MeshStandardMaterial({
          color: 0xaa00ff,
          roughness: 0.2,
          metalness: 0.8
        }),
        name: 'spike'
      }
    ];
    
    // Place obstacles in a strategic pattern
    for (let i = 0; i < obstacleCount; i++) {
      // Use fixed positions for better gameplay (not random)
      const angle = (i / obstacleCount) * Math.PI * 2;
      const distance = safeRadius + (halfSize - safeRadius) * 0.5;
      
      const x = Math.sin(angle) * distance;
      const z = Math.cos(angle) * distance;
      
      // Select obstacle type
      const obstacleType = obstacles[i % obstacles.length];
      const obstacle = new THREE.Mesh(obstacleType.geometry, obstacleType.material);
      
      obstacle.position.set(x, 1.5, z);
      obstacle.rotation.set(0, angle, 0);
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
      obstacle.name = obstacleType.name;
      
      this.scene.add(obstacle);
      this.hazardObjects.push(obstacle);
    }
  }
  
  private async loadFont(): Promise<Font> {
    const loader = new FontLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        './fonts/helvetiker_bold.typeface.json', // Updated path to use public directory
        resolve,
        undefined,
        reject
      );
    });
  }

  private async addSponsorship(): Promise<void> {
    // Load Bustan logo texture with correct public path
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load('./sponsors/bustan.svg'); // Updated path to use public directory
    logoTexture.encoding = THREE.sRGBEncoding;
    logoTexture.colorSpace = THREE.SRGBColorSpace;  // Ensure correct color space

    // Load font for tagline
    const font = await this.loadFont();

    // Create sponsor panels for each wall
    const wallHeight = 15;
    const sponsorWidth = 30;
    const sponsorHeight = 10;
    const halfSize = this.arenaSize / 2;

    // Create materials
    const sponsorMaterial = new THREE.MeshStandardMaterial({
      map: logoTexture,
      transparent: true,
      metalness: 0,
      roughness: 0.1,
      side: THREE.DoubleSide  // Ensure logo is visible from both sides
    });

    const taglineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Gold color
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0xffd700,
      emissiveIntensity: 0.3
    });

    // Create sponsorship panels for each wall
    const wallPositions = [
      { pos: new THREE.Vector3(0, wallHeight/2, -halfSize), rot: 0 },
      { pos: new THREE.Vector3(0, wallHeight/2, halfSize), rot: Math.PI },
      { pos: new THREE.Vector3(-halfSize, wallHeight/2, 0), rot: Math.PI/2 },
      { pos: new THREE.Vector3(halfSize, wallHeight/2, 0), rot: -Math.PI/2 }
    ];

    wallPositions.forEach((wall) => {
      // Create logo panel
      const logoPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(sponsorWidth, sponsorHeight),
        sponsorMaterial
      );
      logoPanel.position.copy(wall.pos);
      logoPanel.rotation.y = wall.rot;
      logoPanel.position.y += 2; // Position above the center
      
      // Offset from wall slightly to prevent z-fighting
      const normalVector = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), wall.rot);
      logoPanel.position.add(normalVector.multiplyScalar(0.1));

      // Create tagline text with loaded font
      const taglineGeometry = new TextGeometry("Baking Happiness", {
        font: font,
        size: 2,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 5
      });

      // Center the text geometry
      taglineGeometry.computeBoundingBox();
      const textWidth = (taglineGeometry.boundingBox?.max.x || 0) - (taglineGeometry.boundingBox?.min.x || 0);
      
      const tagline = new THREE.Mesh(taglineGeometry, taglineMaterial);
      tagline.position.copy(wall.pos);
      tagline.rotation.y = wall.rot;
      tagline.position.y -= sponsorHeight/2 + 1; // Position below the logo
      tagline.position.x -= textWidth/2; // Center horizontally

      this.scene.add(logoPanel);
      this.scene.add(tagline);
      this.arenaElements.push(logoPanel);
      this.arenaElements.push(tagline);
      this.sponsorMaterials.push(sponsorMaterial);
      this.sponsorMaterials.push(taglineMaterial);
    });
  }
  
  public update(deltaTime: number): void {
    // Animate some elements of the arena
    this.time += deltaTime;
    
    // Animate light strips on walls with pulsing intensity
    this.arenaElements.forEach((element, index) => {
      if (element instanceof THREE.Mesh && element.material instanceof THREE.MeshStandardMaterial) {
        // Check if this is a light element with emissive property
        if (element.material.emissive) {
          // Pulse the emissive intensity
          const pulse = 0.7 + Math.sin(this.time * 2 + index) * 0.3;
          element.material.emissiveIntensity = pulse;
        }
      } else if (element instanceof THREE.PointLight) {
        // Pulse the light intensity
        const pulse = 0.5 + Math.sin(this.time * 2 + index) * 0.3;
        element.intensity = pulse;
      }
    });
    
    // Rotate central orb
    this.arenaElements.forEach(element => {
      if (element instanceof THREE.Mesh && 
          element.geometry instanceof THREE.SphereGeometry && 
          element.material instanceof THREE.MeshStandardMaterial && 
          element.material.emissive.getHex() === 0xff3300) {
        
        // This is our central orb - identify by emissive color instead of base color
        element.rotation.y = this.time * 0.5;
        element.rotation.x = this.time * 0.3;
        
        // Make it pulse slightly
        const scale = 1 + Math.sin(this.time * 3) * 0.05;
        element.scale.set(scale, scale, scale);
      }
    });
    
    // Animate hazard objects
    this.hazardObjects.forEach((hazard, index) => {
      if (hazard instanceof THREE.Mesh) {
        if (hazard.name === 'spike') {
          // Rotate spikes slowly
          hazard.rotation.y += deltaTime * 0.5;
        } else if (hazard.name === 'cylinder') {
          // Make cylinders bob up and down
          hazard.position.y = 1.5 + Math.sin(this.time * 2 + index) * 0.2;
        } else if (hazard.name === 'barrier') {
          // Pulse barrier color intensity
          if (hazard.material instanceof THREE.MeshStandardMaterial) {
            const emissiveIntensity = 0.1 + Math.sin(this.time * 3 + index) * 0.1;
            hazard.material.emissiveIntensity = Math.max(0, emissiveIntensity);
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
    // Remove all arena elements except walls and floor
    this.arenaElements.forEach(element => {
      this.scene.remove(element);
    });
    this.arenaElements = [];
    
    // Remove all hazard objects
    this.hazardObjects.forEach(hazard => {
      this.scene.remove(hazard);
    });
    this.hazardObjects = [];
    
    // Recreate the arena
    this.createArena();
  }
}
