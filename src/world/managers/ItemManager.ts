import * as THREE from 'three';

export class ItemManager {
  private scene: THREE.Scene;
  private itemBoxes: THREE.Object3D[] = [];
  
  // Since we're no longer using arenaSize but it might be needed by calling code,
  // use underscore to mark it as intentionally ignored
  constructor(scene: THREE.Scene, _: number) {
    this.scene = scene;
  }
  
  public createItemBoxes(): void {
    // Create item boxes that players can collect for weapons
    const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });
    
    // Create a pattern of item boxes
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        if (Math.abs(i) === 2 || Math.abs(j) === 2) { // Place only around perimeter
          const itemBox = new THREE.Mesh(boxGeometry, boxMaterial);
          itemBox.position.set(i * 40, 1.5, j * 40);
          
          // Add rotation animation
          itemBox.userData = {
            type: 'itemBox',
            collected: false,
            respawnTime: 5000, // 5 seconds
            originalY: 1.5,
            rotationSpeed: 0.02
          };
          
          this.scene.add(itemBox);
          this.itemBoxes.push(itemBox);
        }
      }
    }
  }
  
  public update(): void {
    // Removed unused deltaTime parameter
    // Rotate item boxes
    this.itemBoxes.forEach(box => {
      if (!box.userData.collected) {
        box.rotation.y += box.userData.rotationSpeed;
        
        // Add floating animation
        box.position.y = box.userData.originalY + Math.sin(Date.now() * 0.002) * 0.5;
      }
    });
  }
  
  public checkCollisions(collider: THREE.Box3): void {
    // Check collisions with item boxes and collect them
    this.itemBoxes.forEach(box => {
      if (!box.userData.collected) {
        const boxBoundingBox = new THREE.Box3().setFromObject(box);
        if (collider.intersectsBox(boxBoundingBox)) {
          this.collectItemBox(box);
        }
      }
    });
  }
  
  private collectItemBox(box: THREE.Object3D): void {
    // Removed unused car parameter
    // Mark as collected and hide
    box.userData.collected = true;
    box.visible = false;
    
    // TODO: Give weapon to the player who collected it
    // Future implementation: car.giveWeapon(this.getRandomWeapon());
    
    // Schedule respawn
    setTimeout(() => {
      box.userData.collected = false;
      box.visible = true;
    }, box.userData.respawnTime);
  }
  
  public getEntitiesForMinimap(): any[] {
    const entities: any[] = [];
    
    // Add item boxes to minimap
    this.itemBoxes.forEach(box => {
      if (!box.userData.collected) {
        entities.push({
          position: box.position,
          type: 'itemBox'
        });
      }
    });
    
    return entities;
  }
  
  public reset(): void {
    // Reset all item boxes
    this.itemBoxes.forEach(box => {
      box.userData.collected = false;
      box.visible = true;
    });
  }
}
