/**
 * 3D City Scene - Scene Manager
 * Handles the Three.js scene setup, rendering, and updates
 */

// Using global THREE object
// Using THREE.OrbitControls from the global scope

// Define SceneManager as a global class (no export)
class SceneManager {
    constructor() {
        // Scene related properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Time tracking for animations
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        
        // Environment settings
        this.timeOfDay = 12; // Noon by default (0-24)
        this.dayDuration = 300; // Seconds for a full day cycle
        this.isNight = false;
        
        // Scene components will be added here later
        this.buildingManager = null;
        this.roadNetwork = null;
        this.vehicleSystem = null;
        this.pedestrianSystem = null;
        this.environmentManager = null;
        this.lightingSystem = null;
    }
    
    /**
     * Initialize the scene
     * @param {HTMLElement} container - The container to render the scene into
     */
    initialize(container) {
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        this.scene.fog = new THREE.FogExp2(0xC8D1DC, 0.0025); // Add fog for depth
        
        // Create the camera
        this.setupCamera(container);
        
        // Create the renderer
        this.setupRenderer(container);
        
        // Create the camera controls
        this.setupControls();
        
        // Add basic scene elements
        this.setupBasicElements();
        
        // Initial resize to set dimensions
        this.resize(container.clientWidth, container.clientHeight);
    }
    
    /**
     * Set up the camera
     * @param {HTMLElement} container - The container element
     */
    setupCamera(container) {
        const fov = 60;
        const aspect = container.clientWidth / container.clientHeight;
        const near = 1;
        const far = 10000;
        
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(200, 200, 200);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Set up the WebGL renderer
     * @param {HTMLElement} container - The container element
     */
    setupRenderer(container) {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        container.appendChild(this.renderer.domElement);
    }
    
    /**
     * Set up camera controls
     */
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 100;
        this.controls.maxDistance = 800;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent camera from going below ground
    }
    
    /**
     * Set up basic scene elements
     */
    setupBasicElements() {
        console.log("Setting up basic elements");
        
        // Add a grid helper for development
        const gridHelper = new THREE.GridHelper(1000, 100, 0x555555, 0x333333);
        this.scene.add(gridHelper);
        
        // Add ground plane
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e824c, // Green color for the ground
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
        ground.position.y = -0.1; // Slightly below 0 to avoid z-fighting with the grid
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add simple ambient and directional light instead of full lighting system
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Add a simple cube for testing
        const cubeGeometry = new THREE.BoxGeometry(20, 20, 20);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x0088ff });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, 10, 0);
        cube.castShadow = true;
        this.scene.add(cube);
        
        console.log("Basic elements setup complete");
        
        // Add some user interface elements
        this.setupUserInterface();
        
        /* Temporarily comment out complex systems
        // Initialize the lighting system
        this.lightingSystem = new LightingSystem(this.scene);
        this.lightingSystem.initialize();
        
        // Initialize the building manager
        this.buildingManager = new BuildingManager(this.scene);
        this.buildingManager.initialize();
        
        // Initialize the environment manager
        this.environmentManager = new EnvironmentManager(this.scene);
        this.environmentManager.initialize();
        this.environmentManager.populateEnvironment(500, this.lightingSystem);
        */
    }
    
    /**
     * Set up user interface elements
     */
    setupUserInterface() {
        // Add stats element
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.innerHTML = `Scene Loaded - Basic Elements Only`;
            
            // Add basic control info
            const controlsElement = document.getElementById('controls-info');
            if (controlsElement) {
                controlsElement.innerHTML = `
                    <p>Mouse: Rotate | Scroll: Zoom | Right Click: Pan</p>
                    <div class="time-controls">
                        <button id="debug-button">Debug Info</button>
                        <button id="rotate-cube">Rotate Cube</button>
                    </div>
                `;
                
                // Add event listener for debug button
                setTimeout(() => {
                    document.getElementById('debug-button')?.addEventListener('click', () => {
                        console.log("Debug button clicked");
                        const debugInfo = {
                            scene: this.scene ? "Initialized" : "Not initialized",
                            camera: this.camera ? "Initialized" : "Not initialized",
                            renderer: this.renderer ? "Initialized" : "Not initialized",
                            controls: this.controls ? "Initialized" : "Not initialized"
                        };
                        console.table(debugInfo);
                        alert("Debug info logged to console. Press F12 to view.");
                    });
                    
                    // Add rotating animation to cube when button clicked
                    document.getElementById('rotate-cube')?.addEventListener('click', () => {
                        const cube = this.scene.getObjectByProperty('type', 'Mesh');
                        if (cube) {
                            cube.rotation.y += Math.PI / 4;
                        }
                    });
                }, 100);
            }
        }
    }
    
    /**
     * Get the current delta time
     * @returns {number} Delta time in seconds
     */
    getDeltaTime() {
        this.deltaTime = this.clock.getDelta();
        return this.deltaTime;
    }
    
    /**
     * Update all scene components
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        // Update controls
        this.controls.update();
        
        // Rotate cube slowly for animation
        const cube = this.scene.getObjectByProperty('type', 'Mesh');
        if (cube) {
            cube.rotation.y += deltaTime * 0.5;
            cube.rotation.x += deltaTime * 0.2;
        }
        
        /* Temporarily commented out complex systems
        // Update the lighting system
        if (this.lightingSystem) {
            this.lightingSystem.update(deltaTime);
            this.isNight = this.lightingSystem.getIsNight();
        }
        
        // Update the building manager
        if (this.buildingManager) {
            this.buildingManager.update(deltaTime, this.isNight);
        }
        
        // Update the environment manager
        if (this.environmentManager) {
            this.environmentManager.update(deltaTime, this.isNight);
        }
        
        // Update the various systems (to be implemented)
        // if (this.roadNetwork) this.roadNetwork.update(deltaTime);
        // if (this.vehicleSystem) this.vehicleSystem.update(deltaTime);
        // if (this.pedestrianSystem) this.pedestrianSystem.update(deltaTime);
        */
    }
    
    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Handle window resize
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // Update camera aspect ratio and projection matrix
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(width, height);
    }
}