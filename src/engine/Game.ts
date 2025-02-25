import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Vehicle } from './Vehicle';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private physicsWorld: CANNON.World;
    private vehicle: Vehicle;

    constructor() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
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
            friction: 0.8,          // Increased friction
            restitution: 0.1,       // Reduced bounciness
            contactEquationStiffness: 1e6,
            contactEquationRelaxation: 3
        });

        this.physicsWorld.addContactMaterial(defaultContactMaterial);
        this.physicsWorld.defaultContactMaterial = defaultContactMaterial;

        // Set up camera position
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);

        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add ground plane with improved material
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            side: THREE.DoubleSide
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);

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

        // Adjust camera position for better view
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 0, 0);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start the game loop
        this.animate();
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
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}