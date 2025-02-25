import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BuildingManager } from './buildings/BuildingManager.js';
import Stats from 'three/addons/libs/stats.module.js';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.buildingManager = null;
        this.stats = null;
    }
    
    initialize(container) {
        // Create stats monitor
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
        
        // Create the scene with fog for distance culling
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 500, 1000);
        
        // Create the camera with adjusted settings
        this.camera = new THREE.PerspectiveCamera(
            60, // Reduced FOV for better performance
            container.clientWidth / container.clientHeight,
            1, // Increased near plane
            1200 // Reduced far plane for better depth precision
        );
        this.camera.position.set(200, 200, 200);
        this.camera.lookAt(0, 0, 0);
        
        // Create the renderer with optimized settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Optimize controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 500;
        this.controls.minDistance = 50;
        
        // Add basic elements to the scene
        this.addBasicElements();

        // Initialize building manager
        this.buildingManager = new BuildingManager(this.scene);
        this.buildingManager.initialize();
    }
    
    addBasicElements() {
        // Add a grid helper
        const gridHelper = new THREE.GridHelper(1000, 100);
        this.scene.add(gridHelper);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Add a simple ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1e824c, 
            side: THREE.DoubleSide 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    update() {
        const deltaTime = this.clock.getDelta();
        
        // Update controls
        this.controls.update();
        
        // Update building visibility
        if (this.buildingManager) {
            this.buildingManager.updateVisibility(this.camera);
        }
        
        // Update stats
        if (this.stats) {
            this.stats.update();
        }
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        // Clean up resources
        if (this.buildingManager) {
            this.buildingManager.dispose();
        }
        
        // Remove stats
        if (this.stats && this.stats.dom && this.stats.dom.parentNode) {
            this.stats.dom.parentNode.removeChild(this.stats.dom);
        }
    }
}