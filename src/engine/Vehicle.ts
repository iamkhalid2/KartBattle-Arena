import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Vehicle {
    private mesh: THREE.Group;
    private body: CANNON.Body;
    private vehicle: CANNON.RaycastVehicle;
    private engineForce: number = 0;
    private brakeForce: number = 0;
    private steeringAngle: number = 0;
    private maxSteerVal: number = 0.5;
    private maxForce: number = 500;
    private wheelMeshes: THREE.Group[] = [];
    private wheelBodies: CANNON.WheelInfo[] = [];
    private wheelPositions = [
        { x: -1, y: 0.4, z: -1.5 }, // Front Left
        { x: 1, y: 0.4, z: -1.5 },  // Front Right
        { x: -1, y: 0.4, z: 1.5 },  // Back Left
        { x: 1, y: 0.4, z: 1.5 }    // Back Right
    ];

    constructor(scene: THREE.Scene, world: CANNON.World) {
        // Create the car mesh
        this.mesh = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 0.6, 4.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x3366ff,
            shininess: 80
        });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.position.y = 0.6;
        this.mesh.add(bodyMesh);
        
        // Add car roof
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.5, 2.5);
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2255dd,
            shininess: 80 
        });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.set(0, 1.15, 0);
        roofMesh.castShadow = true;
        this.mesh.add(roofMesh);
        
        // Add windshields
        const windshieldGeometry = new THREE.PlaneGeometry(1.7, 0.6);
        const windshieldMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xaaddff, 
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            shininess: 100
        });
        
        // Front windshield
        const frontWindshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        frontWindshield.position.set(0, 1, -1.1);
        frontWindshield.rotation.x = Math.PI / 4;
        this.mesh.add(frontWindshield);
        
        // Back windshield
        const backWindshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        backWindshield.position.set(0, 1, 1.1);
        backWindshield.rotation.x = -Math.PI / 4;
        this.mesh.add(backWindshield);
        
        // Add headlights
        const headlightGeometry = new THREE.CircleGeometry(0.2, 16);
        const headlightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffcc, 
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });
        
        // Left headlight
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.6, 0.6, -2.26);
        leftHeadlight.rotation.y = Math.PI;
        this.mesh.add(leftHeadlight);
        
        // Right headlight
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.6, 0.6, -2.26);
        rightHeadlight.rotation.y = Math.PI;
        this.mesh.add(rightHeadlight);
        
        // Add taillights
        const taillightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff3333, 
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const leftTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
        leftTaillight.position.set(-0.6, 0.6, 2.26);
        this.mesh.add(leftTaillight);
        
        const rightTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
        rightTaillight.position.set(0.6, 0.6, 2.26);
        this.mesh.add(rightTaillight);

        // Create wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 24);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x111111,
            shininess: 30
        });
        
        // Add wheel rims
        const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.41, 16);
        const rimMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            shininess: 100
        });
        
        // Create wheels at positions
        this.wheelPositions.forEach(() => {
            const wheelGroup = new THREE.Group();
            
            // Create tire
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            wheelGroup.add(wheel);
            
            // Create rim
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);
            
            // Add to scene instead of parenting to mesh
            scene.add(wheelGroup);
            this.wheelMeshes.push(wheelGroup);
        });

        // Add car to scene
        scene.add(this.mesh);

        // Create physics body
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.body = new CANNON.Body({
            mass: 1500,
            position: new CANNON.Vec3(0, 3, 0),
            shape: chassisShape,
        });

        // Set up physics vehicle
        const wheelOptions = {
            radius: 0.4,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 45,
            suspensionRestLength: 0.4,
            frictionSlip: 2,
            dampingRelaxation: 2.5,
            dampingCompression: 4.5,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(),
            maxSuspensionTravel: 0.5,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.body,
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2
        });

        // Add wheels to the vehicle
        this.wheelPositions.forEach((pos) => {
            wheelOptions.chassisConnectionPointLocal.set(pos.x, pos.y - 0.3, pos.z);
            this.vehicle.addWheel(wheelOptions);
        });

        // Add vehicle to world
        this.vehicle.addToWorld(world);

        // Store wheel bodies after adding wheels
        this.vehicle.wheelInfos.forEach((wheel) => {
            this.wheelBodies.push(wheel);
        });

        // Set initial rotation to face forward (-Z direction)
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);

        // Add vehicle controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent) {
        switch(event.key.toLowerCase()) {
            case 'w':
                this.engineForce = this.maxForce;
                break;
            case 's':
                this.engineForce = -this.maxForce / 2;
                break;
            case 'a':
                this.steeringAngle = this.maxSteerVal;
                break;
            case 'd':
                this.steeringAngle = -this.maxSteerVal;
                break;
            case ' ':
                this.brakeForce = 1000000;
                break;
        }
    }

    private handleKeyUp(event: KeyboardEvent) {
        switch(event.key.toLowerCase()) {
            case 'w':
            case 's':
                this.engineForce = 0;
                break;
            case 'a':
            case 'd':
                this.steeringAngle = 0;
                break;
            case ' ':
                this.brakeForce = 0;
                break;
        }
    }

    public update(): void {
        // Apply engine force to back wheels
        this.vehicle.applyEngineForce(this.engineForce, 2);
        this.vehicle.applyEngineForce(this.engineForce, 3);

        // Apply steering to front wheels
        this.vehicle.setSteeringValue(this.steeringAngle, 0);
        this.vehicle.setSteeringValue(this.steeringAngle, 1);

        // Apply brake force to all wheels
        for (let i = 0; i < 4; i++) {
            this.vehicle.setBrake(this.brakeForce, i);
        }

        // Update wheel positions and rotations
        this.vehicle.wheelInfos.forEach((wheel, i) => {
            const wheelMesh = this.wheelMeshes[i];
            
            // Get wheel world position from physics
            const position = new THREE.Vector3(
                wheel.worldTransform.position.x,
                wheel.worldTransform.position.y,
                wheel.worldTransform.position.z
            );
            wheelMesh.position.copy(position);
            
            // Get wheel orientation
            const rotationQuaternion = new THREE.Quaternion(
                wheel.worldTransform.quaternion.x,
                wheel.worldTransform.quaternion.y,
                wheel.worldTransform.quaternion.z,
                wheel.worldTransform.quaternion.w
            );
            
            // Apply orientation to wheel mesh
            wheelMesh.quaternion.copy(rotationQuaternion);
            
            // Apply wheel rolling rotation
            const wheelRotation = wheel.rotation;
            wheelMesh.children[0].rotation.z = wheelRotation; // Tire
            wheelMesh.children[1].rotation.z = wheelRotation; // Rim
        });

        // Update chassis position and rotation
        const chassisPosition = new THREE.Vector3(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
        this.mesh.position.copy(chassisPosition);
        
        const chassisQuaternion = new THREE.Quaternion(
            this.body.quaternion.x,
            this.body.quaternion.y,
            this.body.quaternion.z,
            this.body.quaternion.w
        );
        this.mesh.quaternion.copy(chassisQuaternion);
    }
}