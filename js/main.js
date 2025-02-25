/**
 * 3D City Scene - Main Application
 * Main entry point for the application
 */

// Global variables
// Now using global THREE object instead of ES modules
let sceneManager;
let stats;

// Initialize the application when DOM is fully loaded
window.addEventListener('DOMContentLoaded', init);

function init() {
    // Create performance monitor
    initStats();
    
    // Initialize scene manager
    initScene();
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

/**
 * Initialize the Stats performance monitor
 */
function initStats() {
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb
    stats.dom.classList.add('stats-panel');
    document.body.appendChild(stats.dom);
}

/**
 * Initialize the scene manager
 */
function initScene() {
    // Get the container element
    const container = document.getElementById('scene-container');
    
    // Create scene manager from global object
    console.log("Creating SceneManager...");
    try {
        sceneManager = new SceneManager();
        sceneManager.initialize(container);
        console.log("SceneManager initialized successfully");
    } catch (e) {
        console.error("Error initializing SceneManager:", e);
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.innerHTML = `Error initializing scene: ${e.message}`;
            statsElement.style.color = 'red';
        }
    }
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    stats.begin();
    
    // Update scene
    const deltaTime = sceneManager.getDeltaTime();
    sceneManager.update(deltaTime);
    sceneManager.render();
    
    stats.end();
}

/**
 * Handle window resize event
 */
function onWindowResize() {
    sceneManager.resize(window.innerWidth, window.innerHeight);
}