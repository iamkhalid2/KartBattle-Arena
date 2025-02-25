import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Vehicle {
    private mesh: THREE.Group;
    private body: CANNON.Body;
    private engineForce: number = 0;
    private steeringAngle: number = 0;
    private maxSteerVal: number = Math.PI / 4;
    private maxForce: number = 3000; // Increased force for better movement
    private brakeForce: number = 0;

    constructor(scene: THREE.Scene, world: CANNON.World) {
        // Create the car mesh
        this.mesh = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.position.y = 0.5;
        this.mesh.add(bodyMesh);

        // Add wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        // Position wheels
        const wheelPositions = [
            { x: -1, y: 0.4, z: -1.2 }, // Front Left
            { x: 1, y: 0.4, z: -1.2 },  // Front Right
            { x: -1, y: 0.4, z: 1.2 },  // Back Left
            { x: 1, y: 0.4, z: 1.2 }    // Back Right
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.castShadow = true;
            this.mesh.add(wheel);
        });

        // Add car to scene
        scene.add(this.mesh);

        // Create physics body with adjusted values
        const shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.body = new CANNON.Body({
            mass: 1000, // Reduced mass for better acceleration
            position: new CANNON.Vec3(0, 1, 0),
            shape: shape,
            material: new CANNON.Material({
                friction: 0.7,
                restitution: 0.3
            })
        });

        // Add body to physics world
        world.addBody(this.body);

        // Set initial rotation to face forward (-Z direction)
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);

        // Adjust damping for better control
        this.body.angularDamping = 0.95; // Increased for more stable steering
        this.body.linearDamping = 0.3; // Reduced for better movement

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
                this.brakeForce = 1000;
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

    update() {
        // Get the current forward direction in world space
        const forward = new CANNON.Vec3(0, 0, -1); // Changed to -1 for correct direction
        
        if (this.engineForce !== 0) {
            // Apply force in the car's current facing direction
            const currentRotation = this.body.quaternion;
            const worldForward = currentRotation.vmult(forward);
            const force = worldForward.scale(this.engineForce);
            
            // Apply force at the center of mass
            this.body.applyImpulse(force, this.body.position);
        }

        // Apply steering with improved handling
        if (this.steeringAngle !== 0) {
            const rotation = new CANNON.Quaternion();
            const speed = this.body.velocity.length();
            const steerFactor = Math.max(0.01, Math.min(0.03, 0.03 * (10 / (speed + 10))));
            rotation.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.steeringAngle * steerFactor);
            this.body.quaternion = rotation.mult(this.body.quaternion);
        }

        // Apply brake force with velocity-based scaling
        if (this.brakeForce > 0) {
            const velocity = this.body.velocity;
            const speed = velocity.length();
            if (speed > 0.1) {
                const brakeScale = Math.min(speed, this.brakeForce);
                const brakingDirection = velocity.unit().scale(-brakeScale);
                this.body.applyImpulse(brakingDirection, this.body.position);
            }
        }

        // Update mesh position to match physics body
        this.mesh.position.copy(this.body.position as any);
        this.mesh.quaternion.copy(this.body.quaternion as any);
    }
}