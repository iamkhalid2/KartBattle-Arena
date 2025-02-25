import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Vehicle {
    private mesh: THREE.Group;
    private body: CANNON.Body;
    private engineForce: number = 0;
    private steeringAngle: number = 0;
    private maxSteerVal: number = Math.PI / 6; // Reduced for better handling
    private maxForce: number = 100; // Reduced force for better control
    private brakeForce: number = 0;
    
    // Wheel meshes and wheel positions for visual updates
    private wheelMeshes: THREE.Mesh[] = [];
    private wheelPositions = [
        { x: -1, y: 0.4, z: -1.5 }, // Front Left
        { x: 1, y: 0.4, z: -1.5 },  // Front Right
        { x: -1, y: 0.4, z: 1.5 },  // Back Left
        { x: 1, y: 0.4, z: 1.5 }    // Back Right
    ];

    constructor(scene: THREE.Scene, world: CANNON.World) {
        // Create the car mesh with improved appearance
        this.mesh = new THREE.Group();
        
        // Car body - improved with a more car-like shape
        const bodyGeometry = new THREE.BoxGeometry(2, 0.6, 4.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x3366ff,  // Blue color
            shininess: 80     // More shiny
        });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.position.y = 0.6;
        this.mesh.add(bodyMesh);
        
        // Add car roof (slightly smaller than body)
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.5, 2.5);
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2255dd, // Slightly darker blue
            shininess: 80 
        });
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.set(0, 1.15, 0); // Position on top of the car body
        roofMesh.castShadow = true;
        this.mesh.add(roofMesh);
        
        // Add windshield (front and back)
        const frontWindshieldGeometry = new THREE.PlaneGeometry(1.7, 0.6);
        const windshieldMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xaaddff, 
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            shininess: 100
        });
        
        // Front windshield
        const frontWindshield = new THREE.Mesh(frontWindshieldGeometry, windshieldMaterial);
        frontWindshield.position.set(0, 1, -1.1);
        frontWindshield.rotation.x = Math.PI / 4; // Angle the windshield
        this.mesh.add(frontWindshield);
        
        // Back windshield
        const backWindshield = new THREE.Mesh(frontWindshieldGeometry, windshieldMaterial);
        backWindshield.position.set(0, 1, 1.1);
        backWindshield.rotation.x = -Math.PI / 4; // Angle the back windshield
        this.mesh.add(backWindshield);
        
        // Add headlights
        const headlightGeometry = new THREE.CircleGeometry(0.2, 16);
        const headlightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffcc, 
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });
        
        // Add two headlights at the front
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.6, 0.6, -2.26);
        leftHeadlight.rotation.y = Math.PI; // Face forward
        this.mesh.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.6, 0.6, -2.26);
        rightHeadlight.rotation.y = Math.PI; // Face forward
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

        // Add wheels with better appearance
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
        this.wheelPositions.forEach((pos, index) => {
            // Create wheel group to hold both tire and rim
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
            
            // Position the wheel group
            wheelGroup.position.set(pos.x, pos.y, pos.z);
            this.mesh.add(wheelGroup);
            
            // Store wheel meshes for steering animation
            this.wheelMeshes.push(wheelGroup);
        });

        // Add car to scene
        scene.add(this.mesh);

        // Create physics body with adjusted values
        const shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.body = new CANNON.Body({
            mass: 200,  // Reduced mass
            position: new CANNON.Vec3(0, 1, 0),
            shape: shape,
            material: new CANNON.Material({
                friction: 0.5,
                restitution: 0.2
            })
        });

        // Add body to physics world
        world.addBody(this.body);

        // Set initial rotation to face forward (-Z direction)
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);

        // Adjust damping for better control
        this.body.angularDamping = 0.5;  // Reduced damping
        this.body.linearDamping = 0.1;

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
                this.engineForce = -this.maxForce / 1.5; // Make reverse a bit faster
                break;
            case 'a':
                this.steeringAngle = this.maxSteerVal;
                break;
            case 'd':
                this.steeringAngle = -this.maxSteerVal;
                break;
            case ' ':
                this.brakeForce = 1200; // Increased brake force
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
        // Fix for movement issue: Apply force directly through the center of mass
        if (this.engineForce !== 0) {
            // Get forward direction in world space
            const forwardDir = new CANNON.Vec3(0, 0, -1);
            const worldForward = this.body.quaternion.vmult(forwardDir);
            
            // Scale the direction by force
            const force = worldForward.scale(this.engineForce);
            
            // Apply force at center of mass
            this.body.applyForce(force, this.body.position);
        }

        // Apply steering with improved handling
        if (this.steeringAngle !== 0) {
            const rotation = new CANNON.Quaternion();
            const speed = this.body.velocity.length();
            
            // Improved steering that gets lighter at higher speeds
            const steerFactor = Math.max(0.01, Math.min(0.05, 0.05 * (15 / (speed + 5))));
            rotation.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.steeringAngle * steerFactor);
            this.body.quaternion = rotation.mult(this.body.quaternion);
            
            // Visually rotate the front wheels for steering
            this.wheelMeshes[0].rotation.y = this.steeringAngle;
            this.wheelMeshes[1].rotation.y = this.steeringAngle;
        } else {
            // Reset wheel rotation when not steering
            this.wheelMeshes[0].rotation.y = 0;
            this.wheelMeshes[1].rotation.y = 0;
        }

        // Apply brake force with improved physics
        if (this.brakeForce > 0) {
            const velocity = this.body.velocity.clone();
            velocity.y = 0; // Ignore vertical velocity for braking
            const speed = velocity.length();
            
            if (speed > 0.1) {
                // Scale braking force based on current speed for more realistic braking
                const brakeScale = Math.min(speed, this.brakeForce / 20);
                const brakingDirection = velocity.unit().scale(-brakeScale);
                
                // Apply as impulse for immediate effect
                this.body.applyImpulse(brakingDirection, this.body.position);
            }
        }

        // Spin wheels based on velocity
        const speed = this.body.velocity.length();
        const wheelSpinSpeed = speed * 0.3;
        
        // Rotate all wheels based on car's speed
        this.wheelMeshes.forEach(wheel => {
            wheel.children[0].rotation.x += wheelSpinSpeed * (this.engineForce > 0 ? 1 : -1) * 0.05;
            wheel.children[1].rotation.x += wheelSpinSpeed * (this.engineForce > 0 ? 1 : -1) * 0.05;
        });

        // Update mesh position to match physics body
        this.mesh.position.copy(this.body.position as any);
        this.mesh.quaternion.copy(this.body.quaternion as any);
    }
}