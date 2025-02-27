// World.ts - Main world coordinator class for battle arena
import * as THREE from 'three';
import { Car } from '../entities/Car';
// Remove unused imports
import { ObstacleManager } from './ObstacleManager';
import { ArenaManager } from './managers/ArenaManager';
import { LightingManager } from './managers/LightingManager';
import { ItemManager } from './managers/ItemManager';
import { SpawnManager } from './managers/SpawnManager';
import { HazardManager } from './managers/HazardManager';

export class World {
  private arenaSize = 200; // Size of the battle arena
  
  // Modular manager classes
  private obstacleManager: ObstacleManager;
  private arenaManager: ArenaManager;
  private lightingManager: LightingManager;
  private itemManager: ItemManager;
  private spawnManager: SpawnManager;
  private hazardManager: HazardManager;
  
  constructor(scene: THREE.Scene) {
    // Initialize managers
    // Remove unused local variables (will be reinstated when needed in the future)
    this.obstacleManager = new ObstacleManager(scene);
    this.arenaManager = new ArenaManager(scene, this.arenaSize);
    this.lightingManager = new LightingManager(scene, this.arenaSize);
    this.itemManager = new ItemManager(scene, this.arenaSize);
    this.spawnManager = new SpawnManager(scene, this.arenaSize);
    this.hazardManager = new HazardManager(scene, this.arenaSize);
    
    // Initialize world environment
    this.initializeWorld();
  }

  private initializeWorld(): void {
    // Setup the world using our specialized managers
    this.lightingManager.createLights();
    this.arenaManager.createArena();
    this.obstacleManager.generateObstacles(0, 0, this.arenaSize);
    this.itemManager.createItemBoxes();
    this.spawnManager.createSpawnPoints();
    this.hazardManager.createHazards();
  }

  public update(deltaTime: number): void {
    // Update all managers that have update methods
    this.obstacleManager.update();
    this.arenaManager.update();
    this.lightingManager.update();
    this.itemManager.update();
    this.spawnManager.update();
    this.hazardManager.update(deltaTime); // Keep deltaTime for hazardManager as it uses it
  }
  
  public checkCollisions(car: Car): boolean {
    const carBoundingBox = car.getCollider();
    
    // Check collisions with arena walls
    if (this.arenaManager.checkCollisions(carBoundingBox)) {
      return true;
    }
    
    // Check collisions with obstacles
    if (this.obstacleManager.checkCollisions(carBoundingBox)) {
      return true;
    }
    
    // Check collisions with hazards
    this.hazardManager.checkCollisions(carBoundingBox, car);
    
    // Check collisions with item boxes and collect them
    this.itemManager.checkCollisions(carBoundingBox);
    
    return false; // No collision that should stop the car
  }
  
  public getRandomSpawnPoint(): THREE.Vector3 {
    return this.spawnManager.getRandomSpawnPoint();
  }
  
  public getEntitiesForMinimap(): any[] {
    const entities: any[] = [];
    
    // Gather entities from all managers
    entities.push(...this.itemManager.getEntitiesForMinimap());
    entities.push(...this.obstacleManager.getEntitiesForMinimap());
    entities.push(...this.hazardManager.getEntitiesForMinimap());
    entities.push(...this.spawnManager.getEntitiesForMinimap());
    
    return entities;
  }
  
  public getWorldSize(): number {
    return this.arenaSize;
  }
  
  public reset(): void {
    // Reset all managers
    this.itemManager.reset();
    this.obstacleManager.reset();
    this.hazardManager.reset();
    this.spawnManager.reset();
  }
}