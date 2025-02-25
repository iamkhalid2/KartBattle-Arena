import * as THREE from 'three';
import { Building } from './Building.js';

export class BuildingManager {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.buildingTypes = {
            SKYSCRAPER: 'skyscraper',
            APARTMENT: 'apartment',
            SHOP: 'shop'
        };
        // Reduced city size for better performance
        this.citySize = 300; // Reduced from 500
        this.blockSize = 60;
        this.buildingMargin = 5;
        
        // Frustum culling helper
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
    }

    initialize() {
        this.generateCityBlocks();
    }

    generateCityBlocks() {
        const blocksPerSide = Math.floor(this.citySize * 2 / this.blockSize);
        
        // Create blocks in a spiral pattern from center for better LOD management
        const center = Math.floor(blocksPerSide / 2);
        const spiral = this.generateSpiralPattern(blocksPerSide);
        
        spiral.forEach(([x, z]) => {
            const blockX = (x * this.blockSize) - this.citySize + this.blockSize / 2;
            const blockZ = (z * this.blockSize) - this.citySize + this.blockSize / 2;
            this.generateBuildingsInBlock(blockX, blockZ);
        });
    }

    generateSpiralPattern(size) {
        const result = [];
        const center = Math.floor(size / 2);
        let x = center, z = center;
        let dx = 0, dz = -1;
        let steps = 1;
        let stepCount = 0;
        
        for (let i = 0; i < size * size; i++) {
            if (x >= 0 && x < size && z >= 0 && z < size) {
                result.push([x, z]);
            }
            
            if (stepCount === steps) {
                stepCount = 0;
                const temp = dx;
                dx = -dz;
                dz = temp;
                if (dz === 0) steps++;
            }
            
            x += dx;
            z += dz;
            stepCount++;
        }
        
        return result;
    }

    generateBuildingsInBlock(blockX, blockZ) {
        const distanceFromCenter = Math.sqrt(blockX * blockX + blockZ * blockZ);
        const maxDistance = this.citySize * 1.5;
        
        // Progressive building density based on distance from center
        const isLargeBuilding = Math.random() < (0.4 - (distanceFromCenter / maxDistance) * 0.3);

        if (isLargeBuilding) {
            // Create one large building (skyscraper)
            this.createBuilding({
                type: this.buildingTypes.SKYSCRAPER,
                width: 30,
                height: 100 + Math.random() * 100,
                depth: 30,
                position: new THREE.Vector3(blockX, 0, blockZ)
            });
        } else {
            // Create multiple smaller buildings
            const buildingsPerSide = 2;
            const smallBuildingSize = (this.blockSize - this.buildingMargin * (buildingsPerSide + 1)) / buildingsPerSide;

            for (let bx = 0; bx < buildingsPerSide; bx++) {
                for (let bz = 0; bz < buildingsPerSide; bz++) {
                    if (Math.random() < 0.8) { // 20% chance of empty plot
                        const x = blockX - this.blockSize/4 + bx * (smallBuildingSize + this.buildingMargin);
                        const z = blockZ - this.blockSize/4 + bz * (smallBuildingSize + this.buildingMargin);

                        const type = Math.random() < 0.7 ? this.buildingTypes.APARTMENT : this.buildingTypes.SHOP;
                        const height = type === this.buildingTypes.APARTMENT ? 
                            30 + Math.random() * 30 : 
                            15 + Math.random() * 10;

                        this.createBuilding({
                            type: type,
                            width: smallBuildingSize,
                            height: height,
                            depth: smallBuildingSize,
                            position: new THREE.Vector3(x, 0, z)
                        });
                    }
                }
            }
        }
    }

    createBuilding(params) {
        const building = new Building(params);
        const mesh = building.generate();
        this.scene.add(mesh);
        this.buildings.push(building);
        return building;
    }

    updateVisibility(camera) {
        // Update the frustum
        this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

        // Update visibility of buildings
        this.buildings.forEach(building => {
            if (building.mesh) {
                const distanceToCamera = camera.position.distanceTo(building.mesh.position);
                const isInFrustum = this.frustum.containsPoint(building.mesh.position);
                
                // Only show buildings in view frustum and within reasonable distance
                building.mesh.visible = isInFrustum && distanceToCamera < 1000;
            }
        });
    }

    setNightMode(isNight) {
        this.buildings.forEach(building => {
            building.setNightLighting(isNight);
        });
    }

    dispose() {
        // Clean up resources
        this.buildings.forEach(building => {
            if (building.dispose) {
                building.dispose();
            }
            if (building.mesh) {
                this.scene.remove(building.mesh);
            }
        });
        this.buildings = [];
    }
}