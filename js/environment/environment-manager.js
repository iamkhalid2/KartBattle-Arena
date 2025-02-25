/**
 * Environment Manager
 * Manages environmental elements like trees, lampposts, benches, etc.
 */

import * as THREE from 'three';

export class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;
        
        // Store references to all environment elements
        this.elements = {
            trees: [],
            lampposts: [],
            benches: []
        };
        
        // Geometry and material templates (for reuse)
        this.templates = {};
        
        // Distance between elements
        this.streetLampSpacing = 30;
        this.treeSpacing = 20;
    }
    
    /**
     * Initialize the environment manager
     */
    initialize() {
        // Create templates for efficient instancing
        this.createTemplates();
        
        // Add environment statistics to display
        this.updateStatsDisplay();
    }
    
    /**
     * Create template geometries and materials
     */
    createTemplates() {
        // Tree template
        this.templates.tree = {
            // Tree trunk
            trunk: {
                geometry: new THREE.CylinderGeometry(0.5, 1, 6, 8),
                material: new THREE.MeshStandardMaterial({ 
                    color: 0x553311,
                    roughness: 0.9,
                    metalness: 0.1
                })
            },
            // Tree foliage
            foliage: {
                geometry: new THREE.SphereGeometry(3, 8, 8),
                material: new THREE.MeshStandardMaterial({ 
                    color: 0x227722,
                    roughness: 0.8,
                    metalness: 0
                })
            }
        };
        
        // Lamppost template
        this.templates.lamppost = {
            // Pole
            pole: {
                geometry: new THREE.CylinderGeometry(0.2, 0.3, 6, 8),
                material: new THREE.MeshStandardMaterial({ 
                    color: 0x333333,
                    roughness: 0.7,
                    metalness: 0.5
                })
            },
            // Light fixture
            fixture: {
                geometry: new THREE.SphereGeometry(0.5, 8, 8),
                material: new THREE.MeshStandardMaterial({ 
                    color: 0xffffee,
                    emissive: 0xffffee,
                    emissiveIntensity: 0.5,
                    roughness: 0.2,
                    metalness: 0.8
                })
            }
        };
        
        // Bench template
        this.templates.bench = {
            // Seat
            seat: {
                geometry: new THREE.BoxGeometry(3, 0.2, 1),
                material: new THREE.MeshStandardMaterial({ 
                    color: 0x885522,
                    roughness: 0.8,
                    metalness: 0
                })
            },
            // Legs
            leg: {
                geometry: new THREE.BoxGeometry(0.2, 1, 1),
                material: new THREE.MeshStandardMaterial({ 
                    color: 0x333333,
                    roughness: 0.6,
                    metalness: 0.5
                })
            }
        };
    }
    
    /**
     * Populate environment with elements in a city layout
     * @param {number} citySize - Size of the city
     * @param {LightingSystem} lightingSystem - Reference to the lighting system (for street lamps)
     */
    populateEnvironment(citySize, lightingSystem) {
        // Add street lamps along the streets
        this.placeLampsAlongStreets(citySize, lightingSystem);
        
        // Add trees along sidewalks
        this.placeTreesAlongSidewalks(citySize);
        
        // Add benches near trees
        this.placeBenches(citySize);
        
        // Update stats display
        this.updateStatsDisplay();
    }
    
    /**
     * Place lampposts along streets in a grid pattern
     * @param {number} citySize - Size of the city
     * @param {LightingSystem} lightingSystem - Reference to the lighting system
     */
    placeLampsAlongStreets(citySize, lightingSystem) {
        // Calculate number of lamps based on city size
        const lampsPerSide = Math.floor((citySize * 2) / this.streetLampSpacing);
        
        // Place lamps in a grid along streets
        for (let x = -citySize; x <= citySize; x += this.streetLampSpacing) {
            for (let z = -citySize; z <= citySize; z += this.streetLampSpacing) {
                // Skip some lamps randomly for variety
                if (Math.random() > 0.8) continue;
                
                // Only place lamps along streets (at block boundaries)
                if ((Math.abs(x) % 60 < 10 || Math.abs(x % 60) > 50) || 
                    (Math.abs(z) % 60 < 10 || Math.abs(z % 60) > 50)) {
                    this.createLamppost(x, 0, z, lightingSystem);
                }
            }
        }
    }
    
    /**
     * Create a lamppost at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {LightingSystem} lightingSystem - Reference to the lighting system
     */
    createLamppost(x, y, z, lightingSystem) {
        // Create the lamppost group
        const lamppost = new THREE.Group();
        
        // Create pole
        const pole = new THREE.Mesh(
            this.templates.lamppost.pole.geometry,
            this.templates.lamppost.pole.material
        );
        pole.position.set(0, 3, 0); // Center pole at origin
        pole.castShadow = true;
        lamppost.add(pole);
        
        // Create light fixture
        const fixture = new THREE.Mesh(
            this.templates.lamppost.fixture.geometry,
            this.templates.lamppost.fixture.material.clone() // Clone to allow individual emissive control
        );
        fixture.position.set(0, 6, 0); // Top of pole
        lamppost.add(fixture);
        
        // Position lamppost
        lamppost.position.set(x, y, z);
        
        // Add to scene and store reference
        this.scene.add(lamppost);
        this.elements.lampposts.push({
            group: lamppost,
            fixture: fixture
        });
        
        // Add light to lighting system
        if (lightingSystem) {
            lightingSystem.addStreetLight(x, 6, z);
        }
    }
    
    /**
     * Place trees along sidewalks
     * @param {number} citySize - Size of the city
     */
    placeTreesAlongSidewalks(citySize) {
        // Calculate number of trees based on city size
        const treesPerSide = Math.floor((citySize * 2) / this.treeSpacing);
        
        // Place trees along sidewalks (just inside the road boundaries)
        for (let x = -citySize; x <= citySize; x += this.treeSpacing) {
            for (let z = -citySize; z <= citySize; z += this.treeSpacing) {
                // Skip some trees randomly for variety
                if (Math.random() > 0.7) continue;
                
                // Only place trees along sidewalks (near but not on streets)
                const blockSize = 60;
                const roadWidth = 10;
                const sidewalkPosition = roadWidth + 2; // 2 units from road edge
                
                // Calculate position within block
                const xInBlock = Math.abs(x) % blockSize;
                const zInBlock = Math.abs(z) % blockSize;
                
                // Check if position is near a sidewalk
                const isNearXSidewalk = (xInBlock <= sidewalkPosition || xInBlock >= blockSize - sidewalkPosition);
                const isNearZSidewalk = (zInBlock <= sidewalkPosition || zInBlock >= blockSize - sidewalkPosition);
                
                // Avoid corners (where two sidewalks meet)
                const isCorner = isNearXSidewalk && isNearZSidewalk;
                
                if ((isNearXSidewalk || isNearZSidewalk) && !isCorner) {
                    // Add some random offset for natural look
                    const offsetX = (Math.random() - 0.5) * 2;
                    const offsetZ = (Math.random() - 0.5) * 2;
                    
                    this.createTree(x + offsetX, 0, z + offsetZ);
                }
            }
        }
    }
    
    /**
     * Create a tree at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    createTree(x, y, z) {
        // Create the tree group
        const tree = new THREE.Group();
        
        // Create trunk
        const trunk = new THREE.Mesh(
            this.templates.tree.trunk.geometry,
            this.templates.tree.trunk.material
        );
        trunk.position.set(0, 3, 0); // Half height of trunk
        trunk.castShadow = true;
        tree.add(trunk);
        
        // Create foliage (slightly randomize size for variety)
        const foliageScale = 0.8 + Math.random() * 0.4;
        const foliage = new THREE.Mesh(
            this.templates.tree.foliage.geometry,
            this.templates.tree.foliage.material.clone() // Clone to allow individual color adjustments
        );
        
        // Slightly randomize foliage color
        const hue = 0.3 + (Math.random() - 0.5) * 0.1; // Green hue with variation
        const saturation = 0.7 + Math.random() * 0.3;
        const lightness = 0.3 + Math.random() * 0.2;
        foliage.material.color.setHSL(hue, saturation, lightness);
        
        foliage.position.set(0, 7, 0); // Top of trunk
        foliage.scale.set(foliageScale, foliageScale, foliageScale);
        foliage.castShadow = true;
        tree.add(foliage);
        
        // Add some random rotation for variety
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        // Position tree
        tree.position.set(x, y, z);
        
        // Add to scene and store reference
        this.scene.add(tree);
        this.elements.trees.push(tree);
    }
    
    /**
     * Place benches near trees
     * @param {number} citySize - Size of the city
     */
    placeBenches(citySize) {
        // Place a bench near some trees (not all)
        for (const tree of this.elements.trees) {
            // Only place a bench near some trees
            if (Math.random() > 0.8) {
                // Get tree position
                const treePos = tree.position;
                
                // Place bench slightly offset from tree
                const angle = Math.random() * Math.PI * 2;
                const distance = 2 + Math.random();
                const x = treePos.x + Math.cos(angle) * distance;
                const z = treePos.z + Math.sin(angle) * distance;
                
                this.createBench(x, 0, z);
            }
        }
    }
    
    /**
     * Create a bench at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    createBench(x, y, z) {
        // Create the bench group
        const bench = new THREE.Group();
        
        // Create seat
        const seat = new THREE.Mesh(
            this.templates.bench.seat.geometry,
            this.templates.bench.seat.material
        );
        seat.position.set(0, 0.6, 0);
        seat.castShadow = true;
        bench.add(seat);
        
        // Create legs
        const frontLeg = new THREE.Mesh(
            this.templates.bench.leg.geometry,
            this.templates.bench.leg.material
        );
        frontLeg.position.set(-1, 0.5, 0);
        frontLeg.castShadow = true;
        bench.add(frontLeg);
        
        const backLeg = new THREE.Mesh(
            this.templates.bench.leg.geometry,
            this.templates.bench.leg.material
        );
        backLeg.position.set(1, 0.5, 0);
        backLeg.castShadow = true;
        bench.add(backLeg);
        
        // Add random rotation (face the bench in a random direction)
        bench.rotation.y = Math.random() * Math.PI * 2;
        
        // Position bench
        bench.position.set(x, y, z);
        
        // Add to scene and store reference
        this.scene.add(bench);
        this.elements.benches.push(bench);
    }
    
    /**
     * Update environment elements
     * @param {number} deltaTime - Time since last update
     * @param {boolean} isNight - Whether it's night time
     */
    update(deltaTime, isNight) {
        // Update lamppost emissive intensity based on time of day
        for (const lamppost of this.elements.lampposts) {
            if (isNight) {
                lamppost.fixture.material.emissiveIntensity = 0.8;
            } else {
                lamppost.fixture.material.emissiveIntensity = 0.0;
            }
        }
    }
    
    /**
     * Update stats display
     */
    updateStatsDisplay() {
        // Get stats elements
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            // Add environment stats to existing stats
            const existingStats = statsElement.innerHTML;
            const envStats = ` | Trees: ${this.elements.trees.length} | Lamps: ${this.elements.lampposts.length} | Benches: ${this.elements.benches.length}`;
            
            // Check if environment stats are already present
            if (!existingStats.includes('Trees:')) {
                statsElement.innerHTML = existingStats + envStats;
            }
        }
    }
}