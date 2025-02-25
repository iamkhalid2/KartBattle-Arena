import * as THREE from 'three';

// Static shared resources
const sharedWindowGeometry = new THREE.PlaneGeometry(1.5, 1.5);
const sharedWindowMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.3,
    roughness: 0.2,
    emissive: 0x88ccff,
    emissiveIntensity: 0.2
});

export class Building {
    constructor(params) {
        this.width = params.width || 20;
        this.height = params.height || 60;
        this.depth = params.depth || 20;
        this.position = params.position || new THREE.Vector3();
        this.type = params.type || 'basic';
        this.floors = Math.floor(this.height / 3); // Assuming 3 units per floor
        this.mesh = null;
        this.windows = [];
        this.windowInstances = null;
        this.windowCount = 0;
    }

    generate() {
        // Create main building structure with shared geometry
        const geometry = this.getSharedGeometry(this.width, this.height, this.depth);
        const material = this.getSharedMaterial();
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.position.y = this.height / 2;
        
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Frustum culling optimization
        this.mesh.frustumCulled = true;
        
        // Add instanced windows
        this.addWindowInstances();

        return this.mesh;
    }

    // Static geometry cache
    static geometryCache = new Map();
    static materialCache = new Map();

    getSharedGeometry(width, height, depth) {
        const key = `${width}_${height}_${depth}`;
        if (!Building.geometryCache.has(key)) {
            Building.geometryCache.set(key, new THREE.BoxGeometry(width, height, depth));
        }
        return Building.geometryCache.get(key);
    }

    getSharedMaterial() {
        const key = 'building';
        if (!Building.materialCache.has(key)) {
            Building.materialCache.set(key, new THREE.MeshStandardMaterial({
                color: 0x808080,
                metalness: 0.2,
                roughness: 0.8,
            }));
        }
        return Building.materialCache.get(key);
    }

    addWindowInstances() {
        // Calculate total number of windows
        const windowsPerFloor = Math.floor(this.width / 4);
        const totalWindows = windowsPerFloor * (this.floors - 1) * 4; // 4 sides
        this.windowCount = totalWindows;

        // Create instanced mesh for windows
        this.windowInstances = new THREE.InstancedMesh(
            sharedWindowGeometry,
            sharedWindowMaterial,
            totalWindows
        );
        
        const windowSpacingX = 4;
        const windowSpacingY = 3;
        const marginX = (this.width - Math.floor(this.width / windowSpacingX) * windowSpacingX) / 2;
        const marginY = 2;

        const sides = [
            { rotation: 0, x: this.depth / 2 + 0.1 },
            { rotation: Math.PI, x: -this.depth / 2 - 0.1 },
            { rotation: Math.PI / 2, x: this.width / 2 + 0.1 },
            { rotation: -Math.PI / 2, x: -this.width / 2 - 0.1 }
        ];

        let instanceIndex = 0;
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();

        sides.forEach(side => {
            for (let floor = 1; floor < this.floors; floor++) {
                const windowsPerFloor = Math.floor(this.width / windowSpacingX);
                for (let w = 0; w < windowsPerFloor; w++) {
                    const x = w * windowSpacingX + marginX - this.width / 2 + windowSpacingX / 2;
                    const y = floor * windowSpacingY + marginY;
                    const z = side.x;

                    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side.rotation);
                    matrix.makeRotationFromQuaternion(quaternion);
                    matrix.setPosition(x, y, z);

                    this.windowInstances.setMatrixAt(instanceIndex, matrix);
                    instanceIndex++;
                }
            }
        });

        this.windowInstances.instanceMatrix.needsUpdate = true;
        this.mesh.add(this.windowInstances);
    }

    setNightLighting(isNight) {
        if (this.windowInstances) {
            sharedWindowMaterial.emissiveIntensity = isNight ? 0.8 : 0.0;
            sharedWindowMaterial.needsUpdate = true;
        }
    }

    dispose() {
        // Clean up instanced mesh
        if (this.windowInstances) {
            this.windowInstances.dispose();
        }
    }
}