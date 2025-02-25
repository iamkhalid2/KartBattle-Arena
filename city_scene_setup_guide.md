# 3D City Scene Setup Guide

This guide provides instructions for setting up the development environment and creating the initial project structure for the 3D city scene project.

## Prerequisites

- Node.js and npm (latest stable version)
- A modern web browser (Chrome recommended for development)
- A code editor (VS Code recommended)

## Project Setup

### 1. Create Project Structure

First, create the project folder structure as outlined in the project plan:

```
city-scene/
├── index.html
├── style.css
├── js/
│   ├── main.js
│   ├── scene.js
│   ├── buildings/
│   │   └── building.js
│   ├── vehicles/
│   │   └── vehicle.js
│   ├── pedestrians/
│   │   └── pedestrian.js
│   ├── environment/
│   │   └── environment.js
│   ├── lighting/
│   │   └── lighting.js
│   └── controls/
│       └── camera-controls.js
├── assets/
│   ├── models/
│   └── textures/
└── libs/
    └── three.js
```

### 2. Install Dependencies

For a simple setup, you can include Three.js directly via CDN. For a more robust setup using npm:

```bash
# Create package.json
npm init -y

# Install Three.js
npm install three

# Optional dependencies for development
npm install webpack webpack-cli webpack-dev-server --save-dev
npm install copy-webpack-plugin html-webpack-plugin --save-dev
```

### 3. Create Basic HTML File

Create an `index.html` file with the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D City Scene</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="info">
        <h1>3D City Scene</h1>
        <div id="stats">
            <!-- Stats will be displayed here -->
        </div>
        <div id="controls-info">
            <p>Mouse: Rotate | Scroll: Zoom | Right Click: Pan</p>
        </div>
    </div>
    <div id="scene-container"></div>

    <!-- For simple setup using CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="js/main.js" type="module"></script>
    
    <!-- If using npm/webpack, comment out the CDN and use:
    <script src="bundle.js"></script>
    -->
</body>
</html>
```

### 4. Create Basic CSS File

Create a `style.css` file with the following content:

```css
body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #000;
    font-family: Arial, sans-serif;
}

#scene-container {
    position: absolute;
    width: 100%;
    height: 100%;
}

#info {
    position: absolute;
    top: 10px;
    left: 10px;
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 10px;
    border-radius: 5px;
    z-index: 100;
}

#stats {
    margin-top: 10px;
    font-size: 12px;
}

#controls-info {
    margin-top: 5px;
    font-size: 12px;
}
```

### 5. Create Initial JavaScript Files

#### main.js

```javascript
import { SceneManager } from './scene.js';

// Wait for the DOM to load
window.addEventListener('DOMContentLoaded', () => {
    // Get the container element
    const container = document.getElementById('scene-container');
    
    // Create the SceneManager
    const sceneManager = new SceneManager();
    sceneManager.initialize(container);
    
    // Start the animation loop
    animationLoop();
    
    // Animation loop
    function animationLoop() {
        requestAnimationFrame(animationLoop);
        sceneManager.update();
        sceneManager.render();
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        sceneManager.resize(window.innerWidth, window.innerHeight);
    });
});
```

#### scene.js

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.128.0/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
    }
    
    initialize(container) {
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Create the camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            container.clientWidth / container.clientHeight, // Aspect ratio
            0.1, // Near clipping plane
            10000 // Far clipping plane
        );
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);
        
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);
        
        // Create the controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Add basic elements to the scene
        this.addBasicElements();
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
        
        // Will add more update logic for other systems later
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}
```

## Development Workflow

### Basic Setup (CDN method)
1. Create all the files as shown above
2. Open `index.html` in your browser to see the basic scene
3. Modify files and refresh the browser to see changes

### Advanced Setup (using Webpack)
1. Create a webpack configuration file
2. Set up a development server with hot reloading
3. Use npm scripts for building and starting the development server

#### Example webpack.config.js
```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './js/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    devServer: {
        contentBase: './dist',
        open: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'style.css', to: 'style.css' },
                { from: 'assets', to: 'assets' }
            ]
        })
    ]
};
```

#### Add to package.json scripts
```json
"scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production"
}
```

## Implementation Strategy

### Phase 1: Basic Scene
1. Set up the project structure
2. Create a basic scene with a ground plane and camera controls
3. Verify that everything is working correctly

### Phase 2: Start with Building Generation
1. Create the `BuildingManager` class
2. Implement basic procedural building generation
3. Add buildings to the scene in a grid pattern

### Further Phases
Continue implementing each system as outlined in the technical design document, testing each component as it is developed.

## Implementation Tips

1. **Start Small**: Begin with basic shapes and functionality before adding complexity
2. **Test Frequently**: Check performance early and often
3. **Modular Approach**: Keep components separated for easier development and testing
4. **Version Control**: Use Git to track changes and revert if needed
5. **Progressive Enhancement**: Add features incrementally, ensuring each addition works well before moving on

## Next Steps

1. Set up the project structure as outlined above
2. Implement the basic scene with ground plane and camera controls
3. Begin implementing the building generation system
4. Proceed with the remaining components following the technical design document