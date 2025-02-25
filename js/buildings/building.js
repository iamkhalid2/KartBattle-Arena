/**
 * Building Class
 * Represents a single building in the city scene
 */

import * as THREE from 'three';

export class Building {
    /**
     * Create a new building
     * @param {THREE.Scene} scene - The scene to add the building to
     * @param {string} type - The type of building (skyscraper, apartment, shop)
     * @param {Object} size - The size of the building {width, height, depth}
     * @param {Object} position - The position of the building {x, y, z}
     * @param {THREE.Material} material - The material for the building
     */
    constructor(scene, type, size, position, material) {
        this.scene = scene;
        this.type = type;
        this.size = size;
        this.position = position;
        this.material = material;
        
        // The main mesh of the building
        this.mesh = null;
        
        // Window related properties
        this.windowMeshes = [];
        this.windowLights = [];
        this.hasWindowLights = false;
        
        // Additional details
        this.details = [];
    }
    
    /**
     * Create the building mesh and add it to the scene
     */
    create() {
        // Create the main building structure
        this.createMainStructure();
        
        // Add windows
        this.addWindows();
        
        // Add details based on building type
        this.addBuildingDetails();
    }
    
    /**
     * Create the main structure of the building
     */
    createMainStructure() {
        // Create basic geometry based on building type
        let geometry;
        
        if (this.type === 'skyscraper') {
            geometry = this.createSkyscraperGeometry();
        } else if (this.type === 'apartment') {
            geometry = this.createApartmentGeometry();
        } else { // shop
            geometry = this.createShopGeometry();
        }
        
        // Create the mesh
        this.mesh = new THREE.Mesh(geometry, this.material);
        
        // Set position
        this.mesh.position.set(
            this.position.x,
            this.position.y + this.size.height / 2, // Center height
            this.position.z
        );
        
        // Enable shadows
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    /**
     * Create geometry for skyscraper type buildings
     * @returns {THREE.BufferGeometry} Skyscraper geometry
     */
    createSkyscraperGeometry() {
        // Basic shape is a box
        const geometry = new THREE.BoxGeometry(
            this.size.width, 
            this.size.height, 
            this.size.depth
        );
        
        // For taller skyscrapers, taper the top
        if (this.size.height > 100) {
            // Create a more complex geometry by tapering the top
            const shape = new THREE.Shape();
            const width = this.size.width;
            const depth = this.size.depth;
            
            shape.moveTo(-width/2, -depth/2);
            shape.lineTo(width/2, -depth/2);
            shape.lineTo(width/2, depth/2);
            shape.lineTo(-width/2, depth/2);
            shape.lineTo(-width/2, -depth/2);
            
            const extrudeSettings = {
                steps: 1,
                depth: this.size.height,
                bevelEnabled: true,
                bevelThickness: 5,
                bevelSize: 5,
                bevelSegments: 3
            };
            
            return new THREE.ExtrudeGeometry(shape, extrudeSettings);
        }
        
        return geometry;
    }
    
    /**
     * Create geometry for apartment type buildings
     * @returns {THREE.BufferGeometry} Apartment building geometry
     */
    createApartmentGeometry() {
        // Simple box geometry for now
        return new THREE.BoxGeometry(
            this.size.width,
            this.size.height,
            this.size.depth
        );
    }
    
    /**
     * Create geometry for shop type buildings
     * @returns {THREE.BufferGeometry} Shop building geometry
     */
    createShopGeometry() {
        // Shops are wider than tall
        const geometry = new THREE.BoxGeometry(
            this.size.width,
            this.size.height,
            this.size.depth
        );
        
        return geometry;
    }
    
    /**
     * Add windows to the building
     */
    addWindows() {
        // Skip if building is too small
        if (this.size.height < 10) return;
        
        // Window parameters
        const windowSize = 1.5;
        const windowSpacing = 3;
        const floorHeight = 4;
        
        // Calculate number of floors
        const numFloors = Math.floor(this.size.height / floorHeight) - 1; // -1 to leave space at top
        
        // Exit if too few floors
        if (numFloors <= 0) return;
        
        // Create reusable window geometry and material
        const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x333333,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        // Add windows to each side of the building
        const sides = [
            { direction: new THREE.Vector3(1, 0, 0), rotation: [0, Math.PI / 2, 0] }, // +X
            { direction: new THREE.Vector3(-1, 0, 0), rotation: [0, -Math.PI / 2, 0] }, // -X
            { direction: new THREE.Vector3(0, 0, 1), rotation: [0, 0, 0] }, // +Z
            { direction: new THREE.Vector3(0, 0, -1), rotation: [0, Math.PI, 0] } // -Z
        ];
        
        // For each side
        for (const side of sides) {
            // Calculate dimensions for this side
            const width = (side.direction.x !== 0) ? this.size.depth : this.size.width;
            const windowsPerFloor = Math.floor(width / windowSpacing);
            
            if (windowsPerFloor <= 0) continue;
            
            // Create window group for this side
            const windowGroup = new THREE.Group();
            
            // Add windows for each floor
            for (let floor = 0; floor < numFloors; floor++) {
                // Height of this floor
                const y = -this.size.height / 2 + floorHeight * (floor + 1);
                
                // Add windows along this floor
                for (let w = 0; w < windowsPerFloor; w++) {
                    // Calculate window position
                    const offset = (width - (windowsPerFloor - 1) * windowSpacing) / 2;
                    const x = -width / 2 + offset + w * windowSpacing;
                    
                    // Create window mesh
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
                    
                    // Position window slightly outside the building surface
                    const sideOffset = (side.direction.x !== 0) ? this.size.width / 2 : this.size.depth / 2;
                    windowMesh.position.set(
                        side.direction.x * sideOffset,
                        y,
                        side.direction.z * sideOffset
                    );
                    
                    // Adjust window position along the wall
                    if (side.direction.x !== 0) {
                        windowMesh.position.z = x;
                    } else {
                        windowMesh.position.x = x;
                    }
                    
                    // Set rotation
                    windowMesh.rotation.set(...side.rotation);
                    
                    // Add to window group
                    windowGroup.add(windowMesh);
                    this.windowMeshes.push(windowMesh);
                }
            }
            
            // Add window group to the building mesh
            this.mesh.add(windowGroup);
        }
        
        // Set up for night lighting
        this.hasWindowLights = true;
    }
    
    /**
     * Add details to the building based on its type
     */
    addBuildingDetails() {
        // Add different details based on building type
        if (this.type === 'skyscraper') {
            this.addSkyscraperDetails();
        } else if (this.type === 'apartment') {
            this.addApartmentDetails();
        } else { // shop
            this.addShopDetails();
        }
    }
    
    /**
     * Add details specific to skyscrapers
     */
    addSkyscraperDetails() {
        // Add antenna or spire to taller buildings
        if (this.size.height > 120) {
            const antennaHeight = this.size.height * 0.15;
            const antennaRadius = this.size.width * 0.05;
            const antennaGeometry = new THREE.CylinderGeometry(
                antennaRadius / 2, antennaRadius, antennaHeight, 8
            );
            const antennaMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.8,
                roughness: 0.2
            });
            
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            
            // Position at the top center of the building
            antenna.position.y = this.size.height / 2 + antennaHeight / 2;
            
            this.mesh.add(antenna);
            this.details.push(antenna);
        }
        
        // Add rooftop structures for detail
        const rooftopStructureCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < rooftopStructureCount; i++) {
            const size = {
                width: this.size.width * (0.2 + Math.random() * 0.2),
                height: this.size.height * (0.05 + Math.random() * 0.1),
                depth: this.size.depth * (0.2 + Math.random() * 0.2)
            };
            
            const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
            const material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.5,
                roughness: 0.5
            });
            
            const structure = new THREE.Mesh(geometry, material);
            
            // Position on the roof, slightly off-center
            structure.position.set(
                (Math.random() - 0.5) * (this.size.width * 0.5),
                this.size.height / 2 + size.height / 2,
                (Math.random() - 0.5) * (this.size.depth * 0.5)
            );
            
            this.mesh.add(structure);
            this.details.push(structure);
        }
    }
    
    /**
     * Add details specific to apartment buildings
     */
    addApartmentDetails() {
        // Add balconies to apartment buildings
        const floorsWithBalconies = Math.floor(this.size.height / 4);
        if (floorsWithBalconies <= 0) return;
        
        const balconyDepth = 1.5;
        const balconyHeight = 1;
        const balconySpacing = 5;
        
        const balconyMaterial = new THREE.MeshStandardMaterial({
            color: 0x999999,
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Add balconies to front and back
        for (let side = 0; side < 2; side++) {
            const direction = side === 0 ? 1 : -1;
            const sideOffset = (this.size.depth / 2) * direction;
            
            // Some floors have balconies
            for (let floor = 1; floor < floorsWithBalconies; floor += 2) {
                // Calculate y position
                const y = -this.size.height / 2 + 4 * floor;
                
                // Number of balconies on this floor
                const balconiesPerFloor = Math.floor(this.size.width / balconySpacing);
                
                for (let b = 0; b < balconiesPerFloor; b++) {
                    // Only add some balconies randomly
                    if (Math.random() > 0.7) continue;
                    
                    // Calculate x position
                    const offset = (this.size.width - (balconiesPerFloor - 1) * balconySpacing) / 2;
                    const x = -this.size.width / 2 + offset + b * balconySpacing;
                    
                    // Create balcony geometry
                    const balconyGeometry = new THREE.BoxGeometry(
                        2, balconyHeight, balconyDepth
                    );
                    
                    // Create balcony
                    const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
                    balcony.position.set(
                        x,
                        y,
                        sideOffset + direction * (balconyDepth / 2)
                    );
                    
                    // Add railing
                    const railing = this.createBalconyRailing(2, balconyHeight, balconyDepth);
                    balcony.add(railing);
                    
                    this.mesh.add(balcony);
                    this.details.push(balcony);
                }
            }
        }
    }
    
    /**
     * Create balcony railing for apartment buildings
     * @param {number} width - Width of the balcony
     * @param {number} height - Height of the balcony
     * @param {number} depth - Depth of the balcony
     * @returns {THREE.Group} Railing group
     */
    createBalconyRailing(width, height, depth) {
        const railingGroup = new THREE.Group();
        const railingMaterial = new THREE.MeshStandardMaterial({
            color: 0xAAAAAA,
            metalness: 0.5,
            roughness: 0.5
        });
        
        // Top rail
        const topRailGeom = new THREE.BoxGeometry(width, 0.1, depth);
        const topRail = new THREE.Mesh(topRailGeom, railingMaterial);
        topRail.position.y = height / 2;
        railingGroup.add(topRail);
        
        // Side rails
        const sideRailGeom = new THREE.BoxGeometry(width, height, 0.1);
        const frontRail = new THREE.Mesh(sideRailGeom, railingMaterial);
        frontRail.position.z = depth / 2;
        railingGroup.add(frontRail);
        
        // Vertical posts
        const postGeom = new THREE.BoxGeometry(0.1, height, 0.1);
        
        // Add several posts
        const postCount = 5;
        for (let i = 0; i < postCount; i++) {
            const post = new THREE.Mesh(postGeom, railingMaterial);
            post.position.x = -width / 2 + i * (width / (postCount - 1));
            post.position.z = depth / 2;
            railingGroup.add(post);
        }
        
        return railingGroup;
    }
    
    /**
     * Add details specific to shop buildings
     */
    addShopDetails() {
        // Add storefront details like awning and signage
        const awningWidth = this.size.width * 0.8;
        const awningDepth = 2;
        const awningHeight = 0.5;
        
        // Main storefront side is +Z (arbitrary choice)
        const storeFrontZ = this.size.depth / 2;
        
        // Add awning
        const awningGeometry = new THREE.BoxGeometry(awningWidth, awningHeight, awningDepth);
        
        // Random color for awning
        const awningColor = new THREE.Color(
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5
        );
        
        const awningMaterial = new THREE.MeshStandardMaterial({
            color: awningColor,
            metalness: 0.1,
            roughness: 0.9
        });
        
        const awning = new THREE.Mesh(awningGeometry, awningMaterial);
        
        // Position awning above door at storefront
        awning.position.set(
            0, // Centered on x-axis
            0, // At ground level
            storeFrontZ + awningDepth / 2
        );
        
        this.mesh.add(awning);
        this.details.push(awning);
        
        // Add store sign
        const signWidth = awningWidth * 0.6;
        const signHeight = 2;
        const signDepth = 0.2;
        
        const signGeometry = new THREE.BoxGeometry(signWidth, signHeight, signDepth);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: awningColor,
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 0.7
        });
        
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        
        // Position sign above the storefront
        sign.position.set(
            0, // Centered on x-axis
            this.size.height / 4, // Quarter way up
            storeFrontZ + signDepth / 2 // Just outside the storefront
        );
        
        this.mesh.add(sign);
        this.details.push(sign);
    }
    
    /**
     * Update the building (e.g., window lights at night)
     * @param {number} deltaTime - Time since last update
     * @param {boolean} isNight - Whether it's night time
     */
    update(deltaTime, isNight) {
        // Handle window lighting at night
        if (this.hasWindowLights) {
            for (const window of this.windowMeshes) {
                if (isNight) {
                    // Randomly turn some windows on/off
                    if (Math.random() < 0.01) { // Low probability for change
                        const emissiveIntensity = Math.random() > 0.7 ? 0.5 + Math.random() * 0.5 : 0;
                        window.material.emissive.setRGB(1, 1, 0.8); // Warm light
                        window.material.emissiveIntensity = emissiveIntensity;
                    }
                } else {
                    // During day, all windows are off
                    window.material.emissiveIntensity = 0;
                }
            }
        }
    }
}