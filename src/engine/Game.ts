import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Vehicle } from './Vehicle';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private physicsWorld: CANNON.World;
    private vehicle: Vehicle;
    private followCamera: boolean = true;
    private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 7, 12);

    constructor() {
        // Initialize Three.js scene with fog for better depth perception
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xaaaaaa, 10, 100);
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Initialize renderer with improved settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better shadow quality
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        const appDiv = document.querySelector<HTMLDivElement>('#app');
        if (!appDiv) throw new Error('#app element not found');
        appDiv.innerHTML = ''; // Clear any existing content
        appDiv.appendChild(this.renderer.domElement);

        // Initialize physics world with improved contact settings
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        const defaultMaterial = new CANNON.Material('default');
        const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
            friction: 0.7,             // Good friction for driving
            restitution: 0.1,          // Reduced bounciness
            contactEquationStiffness: 1e6,
            contactEquationRelaxation: 3
        });

        this.physicsWorld.addContactMaterial(defaultContactMaterial);
        this.physicsWorld.defaultContactMaterial = defaultContactMaterial;

        // Set up camera position
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);

        // Add improved lighting
        // Ambient light for overall scene brightness
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Improve shadow quality
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(directionalLight);

        // Add secondary fill light from opposite direction
        const fillLight = new THREE.DirectionalLight(0xffffaa, 0.3);
        fillLight.position.set(-50, 40, -50);
        this.scene.add(fillLight);

        // Create improved ground texture
        const textureLoader = new THREE.TextureLoader();
        const groundSize = 200;
        
        // Create a larger, more realistic ground
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111,  // Asphalt color
            roughness: 0.9,
            metalness: 0.1,
        });
        
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);

        // Add road markings
        const roadWidth = 10;
        const roadLength = groundSize;
        
        // Main road
        const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.1
        });
        const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.position.y = 0.01; // Slightly above the ground to prevent z-fighting
        this.scene.add(roadMesh);
        
        // Add road markings (center line)
        const lineWidth = 0.3;
        const lineGeometry = new THREE.PlaneGeometry(lineWidth, roadLength);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.position.y = 0.02; // Slightly above the road
        this.scene.add(lineMesh);
        
        // Add dashed lines on the sides of the road
        const dashLength = 3;
        const dashGap = 2;
        const dashesCount = Math.floor(roadLength / (dashLength + dashGap));
        const sideOffset = roadWidth / 2 - 0.5;
        
        for (let i = 0; i < dashesCount; i++) {
            const position = -roadLength/2 + (dashLength/2) + i * (dashLength + dashGap);
            
            // Left side dash
            const leftDashGeometry = new THREE.PlaneGeometry(lineWidth, dashLength);
            const leftDashMesh = new THREE.Mesh(leftDashGeometry, lineMaterial);
            leftDashMesh.rotation.x = -Math.PI / 2;
            leftDashMesh.position.set(-sideOffset, 0.02, position);
            this.scene.add(leftDashMesh);
            
            // Right side dash
            const rightDashMesh = leftDashMesh.clone();
            rightDashMesh.position.x = sideOffset;
            this.scene.add(rightDashMesh);
        }
        
        // Add obstacles for fun
        this.addObstacles();

        // Add ground physics with improved material
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane(),
            material: defaultMaterial
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.physicsWorld.addBody(groundBody);

        // Create vehicle
        this.vehicle = new Vehicle(this.scene, this.physicsWorld);
        
        // Set up camera controls
        window.addEventListener('keydown', (event) => {
            if (event.key === 'c') {
                this.followCamera = !this.followCamera;
            }
        });

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start the game loop
        this.animate();
    }
    
    private addObstacles() {
        // Add some obstacles to make driving more interesting
        
        // Create a simple box obstacle
        const createBox = (width: number, height: number, depth: number, position: THREE.Vector3, color: number) => {
            // Visual mesh
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshPhongMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            
            // Physics body
            const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
            const body = new CANNON.Body({
                mass: 0, // Static obstacle
                position: new CANNON.Vec3(position.x, position.y, position.z),
                shape
            });
            this.physicsWorld.addBody(body);
        };
        
        // Create a few boxes around the scene
        createBox(2, 2, 2, new THREE.Vector3(6, 1, -15), 0xff4444);
        createBox(3, 1, 3, new THREE.Vector3(-8, 0.5, -10), 0x44ff44);
        createBox(2, 3, 2, new THREE.Vector3(7, 1.5, 10), 0x4444ff);
        createBox(5, 1.5, 1, new THREE.Vector3(-6, 0.75, 15), 0xffff44);
        
        // Create some ramps
        createBox(8, 1, 4, new THREE.Vector3(0, 0.5, -30), 0x996633);
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update physics
        this.physicsWorld.step(1 / 60);
        
        // Update vehicle
        this.vehicle.update();
        
        // Update camera if follow mode is enabled
        if (this.followCamera) {
            // Get vehicle position from physics body and create Vector3
            const vehiclePosition = new THREE.Vector3(
                this.vehicle.mesh.position.x,
                this.vehicle.mesh.position.y,
                this.vehicle.mesh.position.z
            );
            
            // Get vehicle rotation as Quaternion
            const vehicleQuaternion = this.vehicle.mesh.quaternion.clone();
            
            // Create a matrix from the vehicle's rotation
            const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(vehicleQuaternion);
            
            // Apply the rotation to the camera offset
            const rotatedOffset = this.cameraOffset.clone().applyMatrix4(rotationMatrix);
            
            // Calculate camera position
            const cameraPosition = vehiclePosition.clone().add(rotatedOffset);
            
            // Smoothly move camera
            this.camera.position.lerp(cameraPosition, 0.1);
            
            // Make camera look at vehicle
            this.camera.lookAt(vehiclePosition);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}