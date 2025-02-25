import { SceneManager } from './SceneManager.js';

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