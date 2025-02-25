/**
 * Lighting System
 * Handles day/night cycle and lighting effects
 */

import * as THREE from 'three';

export class LightingSystem {
    /**
     * Create a new lighting system
     * @param {THREE.Scene} scene - The scene to add lights to
     */
    constructor(scene) {
        this.scene = scene;
        
        // Main light sources
        this.sunLight = null;
        this.ambientLight = null;
        this.moonLight = null;
        
        // Street lights
        this.streetLights = [];
        
        // Time settings
        this.timeOfDay = 12; // 0-24 hours (12 is noon)
        this.dayDuration = 300; // Seconds for a full day cycle
        this.timeSpeed = 1.0; // Speed multiplier for time
        
        // State tracking
        this.isNight = false;
        this.lastTimeOfDay = this.timeOfDay;
    }
    
    /**
     * Initialize the lighting system
     */
    initialize() {
        // Create sun light (directional light)
        this.sunLight = new THREE.DirectionalLight(0xffffdd, 1);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        
        // Configure shadow properties
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;
        
        this.scene.add(this.sunLight);
        
        // Create ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambientLight);
        
        // Create moon light (dimmer, bluer directional light)
        this.moonLight = new THREE.DirectionalLight(0x8888ff, 0.2);
        this.moonLight.position.set(-100, 100, -50);
        this.moonLight.castShadow = false; // Moon doesn't cast strong shadows
        this.scene.add(this.moonLight);
        
        // Initial light update based on time of day
        this.updateLighting(0);
        
        // Update time of day display
        this.updateTimeDisplay();
    }
    
    /**
     * Add a street light to the scene
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    addStreetLight(x, y, z) {
        // Create a point light for the street lamp
        const light = new THREE.PointLight(0xffffaa, 0, 30); // Start with zero intensity
        light.position.set(x, y, z);
        light.castShadow = true;
        
        // Limit shadow map size for performance
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        
        // Create a simple lamp post geometry
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, y - 2.5, z);
        pole.castShadow = true;
        
        // Create a lamp head
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffaa,
            emissive: 0xffffaa,
            emissiveIntensity: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(x, y, z);
        head.castShadow = true;
        
        // Add to scene
        this.scene.add(light);
        this.scene.add(pole);
        this.scene.add(head);
        
        // Store reference to the light and visuals
        this.streetLights.push({
            light: light,
            pole: pole,
            head: head,
            headMaterial: headMaterial
        });
        
        // Update light based on current time of day
        this.updateStreetLights();
    }
    
    /**
     * Update the lighting system
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        // Update time of day
        this.timeOfDay += (deltaTime * this.timeSpeed * 24) / this.dayDuration;
        if (this.timeOfDay >= 24) {
            this.timeOfDay -= 24;
        }
        
        // Only update lighting if time has changed significantly
        if (Math.abs(this.timeOfDay - this.lastTimeOfDay) > 0.01) {
            this.updateLighting(deltaTime);
            this.lastTimeOfDay = this.timeOfDay;
            this.updateTimeDisplay();
        }
    }
    
    /**
     * Update lighting based on time of day
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateLighting(deltaTime) {
        // Calculate sun position based on time of day
        this.updateSunPosition();
        
        // Calculate light colors and intensities based on time
        this.updateLightProperties();
        
        // Update street lights
        this.updateStreetLights();
        
        // Update fog color based on time
        this.updateFog();
    }
    
    /**
     * Set the time of day
     * @param {number} time - Time in hours (0-24)
     */
    setTimeOfDay(time) {
        this.timeOfDay = time;
        this.updateLighting(0);
        this.updateTimeDisplay();
    }
    
    /**
     * Toggle time speed between normal, fast, and paused
     */
    toggleTimeSpeed() {
        if (this.timeSpeed === 0) {
            this.timeSpeed = 1;
        } else if (this.timeSpeed === 1) {
            this.timeSpeed = 4;
        } else {
            this.timeSpeed = 0;
        }
        this.updateTimeDisplay();
    }
    
    /**
     * Update the sun position based on time of day
     */
    updateSunPosition() {
        // Convert time to radians (0h = -PI/2, 12h = PI/2)
        const angle = (this.timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
        
        // Calculate sun position
        const radius = 400;
        const sunX = Math.cos(angle) * radius;
        const sunY = Math.sin(angle) * radius;
        const sunZ = 0;
        
        // Update directional light position
        this.sunLight.position.set(sunX, sunY, sunZ);
        
        // Update moon position (opposite to sun)
        this.moonLight.position.set(-sunX, Math.max(sunY, 0), -sunZ);
    }
    
    /**
     * Update light properties based on time of day
     */
    updateLightProperties() {
        // Determine if it's day or night
        const hour = this.timeOfDay;
        
        // Sunrise: 6am-8am, Sunset: 6pm-8pm
        const isSunrise = hour >= 6 && hour <= 8;
        const isSunset = hour >= 18 && hour <= 20;
        const isDay = hour > 8 && hour < 18;
        const isNight = hour < 6 || hour > 20;
        
        // Set night state
        this.isNight = !isDay;
        
        // Calculate sun intensity based on sun height
        let sunIntensity, sunColor, ambientIntensity, ambientColor;
        
        if (isDay) {
            // Full day
            sunIntensity = 1.0;
            sunColor = new THREE.Color(0xffffee);
            ambientIntensity = 0.5;
            ambientColor = new THREE.Color(0xffffff);
        } else if (isSunrise) {
            // Sunrise - warm orange light
            const t = (hour - 6) / 2; // 0 to 1 during sunrise
            sunIntensity = 0.5 + t * 0.5;
            sunColor = new THREE.Color(0xff9955);
            ambientIntensity = 0.2 + t * 0.3;
            ambientColor = new THREE.Color(0xffddcc);
        } else if (isSunset) {
            // Sunset - warm orange light
            const t = (hour - 18) / 2; // 0 to 1 during sunset
            sunIntensity = 1.0 - t * 0.8;
            sunColor = new THREE.Color(0xff7744);
            ambientIntensity = 0.5 - t * 0.3;
            ambientColor = new THREE.Color(0xffccbb);
        } else {
            // Night - dim blue light
            sunIntensity = 0;
            sunColor = new THREE.Color(0x000000);
            ambientIntensity = 0.2;
            ambientColor = new THREE.Color(0x334455);
            
            // Activate moon at night
            this.moonLight.intensity = 0.2;
        }
        
        // Update sun light
        this.sunLight.intensity = sunIntensity;
        this.sunLight.color.copy(sunColor);
        
        // Update ambient light
        this.ambientLight.intensity = ambientIntensity;
        this.ambientLight.color.copy(ambientColor);
        
        // Turn off moon during day
        this.moonLight.intensity = isNight ? 0.2 : 0;
    }
    
    /**
     * Update street lights based on time of day
     */
    updateStreetLights() {
        // Determine if lights should be on
        const hour = this.timeOfDay;
        const lightsOn = hour < 6 || hour > 18; // On from 6pm to 6am
        
        // Calculate intensity (fade in/out)
        let intensity = 0;
        
        if (lightsOn) {
            intensity = 1.0;
        } else if (hour > 5 && hour < 7) {
            // Morning fade out
            intensity = 1.0 - (hour - 5) / 2;
        } else if (hour > 17 && hour < 19) {
            // Evening fade in
            intensity = (hour - 17) / 2;
        }
        
        // Update all street lights
        for (const streetLight of this.streetLights) {
            streetLight.light.intensity = intensity;
            streetLight.headMaterial.emissiveIntensity = intensity * 0.5;
        }
    }
    
    /**
     * Update fog color based on time of day
     */
    updateFog() {
        if (!this.scene.fog) return;
        
        let fogColor;
        const hour = this.timeOfDay;
        
        if (hour > 7 && hour < 17) {
            // Day - light blue
            fogColor = new THREE.Color(0xC8D1DC);
        } else if (hour >= 17 && hour <= 19) {
            // Sunset - blend to dark blue
            const t = (hour - 17) / 2;
            fogColor = new THREE.Color().lerpColors(
                new THREE.Color(0xC8D1DC),
                new THREE.Color(0x424a66),
                t
            );
        } else if (hour >= 5 && hour <= 7) {
            // Sunrise - blend to light blue
            const t = (hour - 5) / 2;
            fogColor = new THREE.Color().lerpColors(
                new THREE.Color(0x424a66),
                new THREE.Color(0xC8D1DC),
                t
            );
        } else {
            // Night - dark blue
            fogColor = new THREE.Color(0x424a66);
        }
        
        // Update fog color
        this.scene.fog.color.copy(fogColor);
        this.scene.background.copy(fogColor);
    }
    
    /**
     * Update time of day display
     */
    updateTimeDisplay() {
        // Format time as hours:minutes
        const hours = Math.floor(this.timeOfDay);
        const minutes = Math.floor((this.timeOfDay - hours) * 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12AM
        
        const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        const speedString = this.timeSpeed === 0 ? "PAUSED" : 
                          this.timeSpeed === 1 ? "NORMAL" : 
                          "FAST";
        
        // Update stats element
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            const currentStats = statsElement.innerHTML;
            // Only update the time part without affecting other stats
            const updatedStats = currentStats.replace(
                /Time: .*?( \||\n|$)/,
                `Time: ${timeString} (${speedString})$1`
            ) || `Time: ${timeString} (${speedString})`;
            
            statsElement.innerHTML = updatedStats;
        }
    }
    
    /**
     * Get current night state
     * @returns {boolean} True if it's currently night time
     */
    getIsNight() {
        return this.isNight;
    }
}