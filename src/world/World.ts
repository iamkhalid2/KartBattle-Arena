// World.ts - Main world coordinator class for battle arena
import * as THREE from 'three';
import { Car } from '../entities/Car';
import { ObstacleManager } from './ObstacleManager';
import { ArenaManager } from './managers/ArenaManager';
import { LightingManager } from './managers/LightingManager';
import { ItemManager } from './managers/ItemManager';
import { SpawnManager } from './managers/SpawnManager';
import { HazardManager } from './managers/HazardManager';
import { SkyboxManager } from './SkyboxManager';
import { TerrainManager } from './TerrainManager';

export class World {
  private arenaSize = 200; // Size of the battle arena
  private worldSize = 500; // Size of the overall world (beyond arena)
  
  // Modular manager classes
  private obstacleManager: ObstacleManager;
  private arenaManager: ArenaManager;
  private lightingManager: LightingManager;
  private itemManager: ItemManager;
  private spawnManager: SpawnManager;
  private hazardManager: HazardManager;
  private skyboxManager: SkyboxManager;
  private terrainManager: TerrainManager;
  
  constructor(scene: THREE.Scene) {
    // Initialize managers
    this.obstacleManager = new ObstacleManager(scene);
    this.arenaManager = new ArenaManager(scene, this.arenaSize);
    this.lightingManager = new LightingManager(scene, this.arenaSize);
    this.itemManager = new ItemManager(scene, this.arenaSize);
    this.spawnManager = new SpawnManager(scene, this.arenaSize);
    this.hazardManager = new HazardManager(scene, this.arenaSize);
    this.skyboxManager = new SkyboxManager(scene);
    this.terrainManager = new TerrainManager(scene, this.worldSize);
    
    // Initialize world environment
    this.initializeWorld();
  }

  private initializeWorld(): void {
    // Setup the world using our specialized managers in proper order
    // Sky first (background)
    this.skyboxManager;  // The skybox is created in constructor
    
    // Then terrain (ground outside arena)
    this.terrainManager.createGround();
    this.terrainManager.generateRoads(0, 0, this.arenaSize);
    
    // Add lighting
    this.lightingManager.createLights();
    
    // Then arena (main play area)
    this.arenaManager.createArena();
    
    // Then obstacles and game elements
    this.obstacleManager.generateObstacles(0, 0, this.arenaSize);
    this.itemManager.createItemBoxes();
    this.spawnManager.createSpawnPoints();
    this.hazardManager.createHazards();
  }

  public update(deltaTime: number): void {
    // Update all managers that have update methods
    this.skyboxManager.update(deltaTime);
    this.obstacleManager.update();
    this.arenaManager.update(deltaTime);
    this.lightingManager.update(deltaTime);
    this.itemManager.update();
    this.spawnManager.update();
    this.hazardManager.update(deltaTime);
  }
  
  public updatePlayerPosition(playerPosition: THREE.Vector3): void {
    // Update skybox to follow player
    this.skyboxManager.updatePosition(playerPosition);
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
  
  public getTerrainHeightAt(x: number, z: number): number {
    // Get the height of terrain at given coordinates
    return this.terrainManager.getTerrainHeight(x, z);
  }
  
  public getRandomSpawnPoint(): THREE.Vector3 {
    // Get all hazard positions to avoid spawning near them
    const hazardPositions = this.getHazardPositions();
    
    // Use the improved spawn point method that avoids hazards
    return this.spawnManager.getRandomSpawnPointAwayFromHazards(hazardPositions);
  }
  
  private getHazardPositions(): THREE.Vector3[] {
    const hazardPositions: THREE.Vector3[] = [];
    
    // Get positions of all hazards in the HazardManager
    const hazardObjects = this.hazardManager.getHazardPositions();
    if (hazardObjects && hazardObjects.length) {
      hazardPositions.push(...hazardObjects);
    }
    
    // Get positions of the central arena decoration
    const centralPosition = new THREE.Vector3(0, 0, 0);
    hazardPositions.push(centralPosition); // Avoid spawning at the center
    
    return hazardPositions;
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
    return this.worldSize;
  }
  
  public getArenaSize(): number {
    return this.arenaSize;
  }
  
  public reset(): void {
    // Reset all managers
    this.itemManager.reset();
    this.obstacleManager.reset();
    this.hazardManager.reset();
    this.spawnManager.reset();
    this.arenaManager.reset();
    this.terrainManager.reset();
    this.skyboxManager.reset();
  }
}