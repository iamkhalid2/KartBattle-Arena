/**
 * Building Manager
 * Handles the generation and management of buildings in the city
 */

import * as THREE from 'three';
import { Building } from './building.js';

export class BuildingManager {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        
        // Building types
        this.buildingTypes = {
            SKYSCRAPER: 'skyscraper',
            APARTMENT: 'apartment',
            SHOP: 'shop'
        };
        
        // Material library for reusing materials
        this.materialLibrary = {};
        
        // City layout settings
        this.citySize = 500; // Half-size of the city (extends from -citySize to +citySize)
        this.blockSize = 50; // Size of a city block
        this.roadWidth = 10; // Width of roads
        
        // For performance tracking
        this.buildingCount = 0;
    }
    
    /**
     * Initialize the building manager
     */
    initialize() {
        // Initialize material library
        this.initMaterials();
        
        // Generate city blocks
        this.generateCityBlocks();
        
        // Update stats display
        this.updateStats();
    }
    
    /**
     * Initialize materials library for buildings
     */
    initMaterials() {
        // Skyscraper materials - glass and metal look
        this.materialLibrary.skyscraper = [
            new THREE.MeshStandardMaterial({
                color: 0x88CCEE,
                metalness: 0.7,
                roughness: 0.2,
                envMapIntensity: 1.0
            }),
            new THREE.MeshStandardMaterial({
                color: 0x4488AA,
                metalness: 0.8,
                roughness: 0.2,
                envMapIntensity: 1.0
            }),
            new THREE.MeshStandardMaterial({
                color: 0x6699BB,
                metalness: 0.6,
                roughness: 0.3,
                envMapIntensity: 1.0
            })
        ];
        
        // Apartment building materials
        this.materialLibrary.apartment = [
            new THREE.MeshStandardMaterial({
                color: 0xCCBBBB,
                metalness: 0.1,
                roughness: 0.8
            }),
            new THREE.MeshStandardMaterial({
                color: 0xBBAA99,
                metalness: 0.1,
                roughness: 0.7
            }),
            new THREE.MeshStandardMaterial({
                color: 0xDDCCCC,
                metalness: 0.1,
                roughness: 0.9
            })
        ];
        
        // Shop materials - colorful storefronts
        this.materialLibrary.shop = [
            new THREE.MeshStandardMaterial({
                color: 0xCC8844,
                metalness: 0.2,
                roughness: 0.8
            }),
            new THREE.MeshStandardMaterial({
                color: 0x88CC44,
                metalness: 0.2,
                roughness: 0.8
            }),
            new THREE.MeshStandardMaterial({
                color: 0x4488CC,
                metalness: 0.2,
                roughness: 0.8
            })
        ];
    }
    
    /**
     * Generate city blocks with buildings
     */
    generateCityBlocks() {
        // Number of blocks in each direction (x and z)
        const blocksPerSide = Math.floor((this.citySize * 2) / (this.blockSize + this.roadWidth));
        const halfBlocksPerSide = Math.floor(blocksPerSide / 2);
        
        // Loop through blocks and place buildings
        for (let x = -halfBlocksPerSide; x <= halfBlocksPerSide; x++) {
            for (let z = -halfBlocksPerSide; z <= halfBlocksPerSide; z++) {
                // Calculate block position
                const blockX = x * (this.blockSize + this.roadWidth);
                const blockZ = z * (this.blockSize + this.roadWidth);
                
                // Generate a block of buildings
                this.generateBlock(blockX, blockZ);
            }
        }
    }
    
    /**
     * Generate a city block with multiple buildings
     * @param {number} blockX - X position of block center
     * @param {number} blockZ - Z position of block center
     */
    generateBlock(blockX, blockZ) {
        // Determine block type (affects building distribution)
        const distanceFromCenter = Math.sqrt(blockX * blockX + blockZ * blockZ);
        const blockType = this.determineBlockType(distanceFromCenter);
        
        // Subdivide block into building lots
        const lots = this.subdivideBlock(blockX, blockZ, this.blockSize, blockType);
        
        // Create buildings on each lot
        for (const lot of lots) {
            this.createBuildingOnLot(lot, blockType);
        }
    }
    
    /**
     * Determine the type of block based on distance from center
     * @param {number} distanceFromCenter - Distance from city center
     * @returns {string} Block type
     */
    determineBlockType(distanceFromCenter) {
        // Downtown (skyscrapers)
        if (distanceFromCenter < this.citySize * 0.3) {
            return 'downtown';
        }
        // Midtown (mix of buildings)
        else if (distanceFromCenter < this.citySize * 0.6) {
            return 'midtown';
        }
        // Suburbs (smaller buildings, shops)
        else {
            return 'suburbs';
        }
    }
    
    /**
     * Subdivide a block into building lots
     * @param {number} blockX - X position of block center
     * @param {number} blockZ - Z position of block center
     * @param {number} blockSize - Size of the block
     * @param {string} blockType - Type of the block
     * @returns {Array} Array of lot objects with position and size
     */
    subdivideBlock(blockX, blockZ, blockSize, blockType) {
        const lots = [];
        const halfSize = blockSize / 2;
        
        // Different subdivision strategies based on block type
        if (blockType === 'downtown') {
            // Downtown - fewer, larger buildings
            const lotCount = 1 + Math.floor(Math.random() * 2); // 1-2 buildings per block
            
            if (lotCount === 1) {
                // Single large building taking up most of the block
                lots.push({
                    x: blockX,
                    z: blockZ,
                    width: blockSize * 0.8,
                    depth: blockSize * 0.8,
                    type: this.buildingTypes.SKYSCRAPER
                });
            } else {
                // Two buildings
                const lotSize = blockSize * 0.7;
                lots.push({
                    x: blockX - blockSize * 0.25,
                    z: blockZ - blockSize * 0.25,
                    width: lotSize / 2,
                    depth: lotSize / 2,
                    type: this.buildingTypes.SKYSCRAPER
                });
                
                lots.push({
                    x: blockX + blockSize * 0.25,
                    z: blockZ + blockSize * 0.25,
                    width: lotSize / 2,
                    depth: lotSize / 2,
                    type: this.buildingTypes.SKYSCRAPER
                });
            }
        } 
        else if (blockType === 'midtown') {
            // Midtown - mix of medium-sized buildings
            const lotCount = 2 + Math.floor(Math.random() * 2); // 2-3 buildings per block
            const lotSize = blockSize * 0.6;
            
            for (let i = 0; i < lotCount; i++) {
                let x, z;
                
                if (lotCount === 2) {
                    // Place in diagonal corners
                    x = blockX + (i === 0 ? -1 : 1) * (blockSize * 0.25);
                    z = blockZ + (i === 0 ? -1 : 1) * (blockSize * 0.25);
                } else {
                    // Place in triangle formation
                    if (i === 0) {
                        x = blockX;
                        z = blockZ - blockSize * 0.25;
                    } else {
                        x = blockX + (i === 1 ? -1 : 1) * (blockSize * 0.25);
                        z = blockZ + blockSize * 0.25;
                    }
                }
                
                lots.push({
                    x: x,
                    z: z,
                    width: lotSize / 1.5,
                    depth: lotSize / 1.5,
                    type: Math.random() > 0.3 ? this.buildingTypes.APARTMENT : this.buildingTypes.SKYSCRAPER
                });
            }
        } 
        else {
            // Suburbs - many smaller buildings and shops
            const lotCount = 3 + Math.floor(Math.random() * 3); // 3-5 buildings per block
            const positions = this.generateRandomPositions(blockX, blockZ, halfSize * 0.8, lotCount);
            
            for (let i = 0; i < lotCount; i++) {
                const size = 10 + Math.random() * 15; // Smaller buildings
                
                // Mix of shops and apartments in suburbs
                const type = Math.random() > 0.5 ? 
                    this.buildingTypes.SHOP : 
                    this.buildingTypes.APARTMENT;
                
                lots.push({
                    x: positions[i].x,
                    z: positions[i].z,
                    width: size,
                    depth: size,
                    type: type
                });
            }
        }
        
        return lots;
    }
    
    /**
     * Generate random positions within a block area
     * @param {number} centerX - Block center X
     * @param {number} centerZ - Block center Z
     * @param {number} radius - Block radius
     * @param {number} count - Number of positions to generate
     * @returns {Array} Array of position objects {x, z}
     */
    generateRandomPositions(centerX, centerZ, radius, count) {
        const positions = [];
        const minDistance = radius * 0.5; // Minimum distance between buildings
        
        // Try to place buildings with some minimum spacing
        let attempts = 0;
        const maxAttempts = 30;
        
        while (positions.length < count && attempts < maxAttempts) {
            // Generate a random position within the block
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            const x = centerX + Math.cos(angle) * distance;
            const z = centerZ + Math.sin(angle) * distance;
            
            // Check if the position is far enough from existing positions
            let tooClose = false;
            for (const pos of positions) {
                const dx = x - pos.x;
                const dz = z - pos.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                
                if (dist < minDistance) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                positions.push({ x, z });
            }
            
            attempts++;
        }
        
        // If we couldn't place all buildings with spacing, just place them randomly
        while (positions.length < count) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            positions.push({
                x: centerX + Math.cos(angle) * distance,
                z: centerZ + Math.sin(angle) * distance
            });
        }
        
        return positions;
    }
    
    /**
     * Create a building on a specified lot
     * @param {Object} lot - Lot information
     * @param {string} blockType - Type of the block
     */
    createBuildingOnLot(lot, blockType) {
        // Determine building height based on type and block
        let height;
        
        if (lot.type === this.buildingTypes.SKYSCRAPER) {
            // Skyscrapers vary based on block type
            if (blockType === 'downtown') {
                height = 100 + Math.random() * 150; // Tallest downtown
            } else {
                height = 70 + Math.random() * 80; // Shorter outside downtown
            }
        } 
        else if (lot.type === this.buildingTypes.APARTMENT) {
            height = 20 + Math.random() * 30; // Medium height
        } 
        else { // SHOP
            height = 5 + Math.random() * 10; // Lowest height
        }
        
        // Create the building
        const building = new Building(
            this.scene,
            lot.type,
            {
                width: lot.width,
                height: height,
                depth: lot.depth
            },
            {
                x: lot.x,
                y: 0, // Ground level
                z: lot.z
            },
            this.materialLibrary[lot.type][Math.floor(Math.random() * this.materialLibrary[lot.type].length)]
        );
        
        building.create();
        this.buildings.push(building);
        this.buildingCount++;
    }
    
    /**
     * Update buildings (e.g., window lights at night)
     * @param {number} deltaTime - Time since last update
     * @param {boolean} isNight - Whether it's night time
     */
    update(deltaTime, isNight) {
        // Update all buildings (e.g. window lights)
        for (const building of this.buildings) {
            building.update(deltaTime, isNight);
        }
    }
    
    /**
     * Update stats display
     */
    updateStats() {
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.innerHTML = `Buildings: ${this.buildingCount}`;
        }
    }
}