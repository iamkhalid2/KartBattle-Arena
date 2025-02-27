import * as THREE from 'three';

export class ArenaManager {
  private scene: THREE.Scene;
  private arenaSize: number;
  private arenaWalls: THREE.Mesh[] = [];
  private arenaFloor: THREE.Mesh;
  
  constructor(scene: THREE.Scene, arenaSize: number) {
    this.scene = scene;
    this.arenaSize = arenaSize;
    this.arenaFloor = new THREE.Mesh(); // Initialize to avoid undefined
  }

  public createArena(): void {
    this.createFloor();
    this.createWalls();
    this.createCorners();
  }
  
  private createFloor(): void {
    // Create arena floor
    const floorGeometry = new THREE.PlaneGeometry(this.arenaSize, this.arenaSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });
    
    this.arenaFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.arenaFloor.rotation.x = -Math.PI / 2;
    this.arenaFloor.position.y = 0;
    this.arenaFloor.receiveShadow = true;
    this.scene.add(this.arenaFloor);
    
    // Add grid pattern to the floor for visual reference
    const gridHelper = new THREE.GridHelper(this.arenaSize, 20, 0xFFFFFF, 0x808080);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }
  
  private createWalls(): void {
    // Create arena walls
    const wallHeight = 15;
    const wallThickness = 5;
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.7
    });
    
    // Calculate positions for the four walls
    const halfSize = this.arenaSize / 2;
    const wallPositions = [
      { pos: new THREE.Vector3(0, wallHeight/2, -halfSize - wallThickness/2), size: new THREE.Vector3(this.arenaSize + wallThickness*2, wallHeight, wallThickness) },
      { pos: new THREE.Vector3(0, wallHeight/2, halfSize + wallThickness/2), size: new THREE.Vector3(this.arenaSize + wallThickness*2, wallHeight, wallThickness) },
      { pos: new THREE.Vector3(-halfSize - wallThickness/2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.arenaSize) },
      { pos: new THREE.Vector3(halfSize + wallThickness/2, wallHeight/2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.arenaSize) }
    ];
    
    // Create and add the walls
    wallPositions.forEach(wall => {
      const wallGeometry = new THREE.BoxGeometry(wall.size.x, wall.size.y, wall.size.z);
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.copy(wall.pos);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      
      this.scene.add(wallMesh);
      this.arenaWalls.push(wallMesh);
    });
  }
  
  private createCorners(): void {
    // Add arena corner decorative elements
    const wallHeight = 15;
    const cornerSize = 10;
    const cornerGeometry = new THREE.CylinderGeometry(cornerSize, cornerSize, wallHeight, 16);
    const cornerMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      roughness: 0.2,
      metalness: 0.8
    });
    
    const halfSize = this.arenaSize / 2;
    const cornerPositions = [
      new THREE.Vector3(-halfSize, wallHeight/2, -halfSize),
      new THREE.Vector3(halfSize, wallHeight/2, -halfSize),
      new THREE.Vector3(-halfSize, wallHeight/2, halfSize),
      new THREE.Vector3(halfSize, wallHeight/2, halfSize)
    ];
    
    cornerPositions.forEach(pos => {
      const cornerMesh = new THREE.Mesh(cornerGeometry, cornerMaterial);
      cornerMesh.position.copy(pos);
      cornerMesh.castShadow = true;
      cornerMesh.receiveShadow = true;
      this.scene.add(cornerMesh);
    });
  }
  
  public update(): void {
    // Arena-specific update logic can go here
    // Removed deltaTime parameter since it's not being used
  }
  
  public checkCollisions(collider: THREE.Box3): boolean {
    // Check collisions with arena walls
    for (const wall of this.arenaWalls) {
      const wallBoundingBox = new THREE.Box3().setFromObject(wall);
      if (collider.intersectsBox(wallBoundingBox)) {
        return true;
      }
    }
    
    return false;
  }
  
  public reset(): void {
    // Reset any arena-specific elements if needed
  }
}
