import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Vehicle {
    public mesh: THREE.Group;
    private chassisBody: CANNON.Body;
    private wheels: THREE.Mesh[] = [];
    private engineForce: number = 0;
    private brakeForce: number = 0;
    private steeringValue: number = 0;
    private maxSteerVal: number = 0.5;
    private maxForce: number = 500;
    private maxBrakeForce: number = 50;
    private wheelRotationSpeed: number = 0;
    private maxWheelRotationSpeed: number = 0.3;

    constructor(scene: THREE.Scene, world: CANNON.World) {
        this.mesh = new THREE.Group();
        
        // Main body (chassis)
        const chassisGeometry = new THREE.BoxGeometry(2, 0.6, 4);
        const chassisMaterial = new THREE.MeshPhongMaterial({ color: 0x2196F3 });
        const chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassisMesh.position.y = 0.3;
        chassisMesh.castShadow = true;
        this.mesh.add(chassisMesh);

        // Car cabin
        const cabinGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
        const cabinMaterial = new THREE.MeshPhongMaterial({ color: 0x4FC3F7 });
        const cabinMesh = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabinMesh.position.y = 1;
        cabinMesh.position.z = -0.5;
        cabinMesh.castShadow = true;
        this.mesh.add(cabinMesh);

        // Create physics for the entire vehicle as one body
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.chassisBody = new CANNON.Body({ 
            mass: 150,
            material: new CANNON.Material('vehicle')
        });
        this.chassisBody.addShape(chassisShape);
        this.chassisBody.position.set(0, 4, 0);
        
        // Add wheels as visual elements only
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const wheelPositions = [
            { x: -1, y: 0.4, z: -1.5 },  // Front left
            { x: 1, y: 0.4, z: -1.5 },   // Front right
            { x: -1, y: 0.4, z: 1.5 },   // Back left
            { x: 1, y: 0.4, z: 1.5 }     // Back right
        ];

        wheelPositions.forEach(pos => {
            const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheelMesh.rotation.z = Math.PI / 2;
            wheelMesh.position.set(pos.x, pos.y, pos.z);
            wheelMesh.castShadow = true;
            this.mesh.add(wheelMesh);
            this.wheels.push(wheelMesh);
        });

        // Improve vehicle physics properties
        this.chassisBody.angularDamping = 0.9;
        this.chassisBody.linearDamping = 0.3;

        world.addBody(this.chassisBody);

        // Add keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        scene.add(this.mesh);
    }

    private handleKeyDown(event: KeyboardEvent): void {
        switch(event.key.toLowerCase()) {
            case 'w':
                this.engineForce = this.maxForce;
                break;
            case 's':
                this.engineForce = -this.maxForce / 2;
                break;
            case 'a':
                this.steeringValue = this.maxSteerVal;
                break;
            case 'd':
                this.steeringValue = -this.maxSteerVal;
                break;
            case ' ':
                this.brakeForce = this.maxBrakeForce;
                break;
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        switch(event.key.toLowerCase()) {
            case 'w':
            case 's':
                this.engineForce = 0;
                break;
            case 'a':
            case 'd':
                this.steeringValue = 0;
                break;
            case ' ':
                this.brakeForce = 0;
                break;
        }
    }

    public update(): void {
        // Apply forces to the chassis
        const forward = new CANNON.Vec3(0, 0, 1);
        const right = new CANNON.Vec3(1, 0, 0);
        
        // Rotate the forward direction by the current steering angle
        const forwardWorld = forward.clone();
        const angle = this.steeringValue;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        forwardWorld.x = forward.x * cos - forward.z * sin;
        forwardWorld.z = forward.x * sin + forward.z * cos;
        
        // Apply engine and brake forces
        if (this.engineForce !== 0) {
            const force = forwardWorld.scale(this.engineForce);
            this.chassisBody.applyLocalForce(force, new CANNON.Vec3());
        }
        
        if (this.brakeForce !== 0) {
            this.chassisBody.velocity.scale(0.95, this.chassisBody.velocity);
        }

        // Update visual position and rotation
        this.mesh.position.copy(this.chassisBody.position as any);
        this.mesh.quaternion.copy(this.chassisBody.quaternion as any);

        // Calculate wheel rotation speed based on vehicle velocity
        const speed = this.chassisBody.velocity.length();
        this.wheelRotationSpeed = Math.min(speed * 0.3, this.maxWheelRotationSpeed);
        if (this.engineForce < 0) this.wheelRotationSpeed *= -1;

        // Rotate wheels
        this.wheels.forEach((wheel, index) => {
            // Add continuous rotation to wheels
            wheel.rotation.x += this.wheelRotationSpeed;
            
            // Apply steering rotation to front wheels
            if (index < 2) { // Front wheels
                wheel.rotation.y = this.steeringValue;
            }
        });
    }
}