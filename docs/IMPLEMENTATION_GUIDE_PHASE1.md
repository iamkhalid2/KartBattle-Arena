# Implementation Guide: Phase 1 - Core Driving Mechanics Enhancement

This guide outlines the specific implementation steps needed to enhance the existing driving mechanics for KartBattle.io.

## 1. Drift Mechanics Implementation

### Objectives:
- Add Mario Kart-style drifting that rewards skillful timing
- Implement boost mechanics based on drift duration
- Create visual feedback during drifts

### Implementation Steps:

1. **Modify the `Car.ts` class to support drift state:**
   ```typescript
   // Add to Car.ts properties
   private isDrifting: boolean = false;
   private driftDirection: number = 0; // -1 = left, 1 = right
   private driftTimer: number = 0;
   private driftBoostLevel: number = 0;
   private driftBoostReady: boolean = false;
   private driftParams: DriftParameters = {
     driftBoostLevels: [1.0, 2.5, 4.0], // seconds for each boost level
     driftBoostPowers: [1.2, 1.5, 2.0], // multipliers for each level
     minDriftAngle: 0.3, // radians
     maxDriftAngle: 0.8, // radians
     driftTurnMultiplier: 1.2 // steering is X times more responsive during drift
   };
   ```

2. **Add drift initiation logic:**
   ```typescript
   // Add to Car.ts update() method
   // Detect drift initiation (e.g., when pressing spacebar while turning)
   const driftInput = this.inputManager.isDriftPressed();
   const isTurning = Math.abs(turnInput) > 0.1;
   
   // Start drift if conditions are met
   if (driftInput && isTurning && this.speed > 0.1 && !this.isDrifting) {
     this.isDrifting = true;
     this.driftDirection = Math.sign(turnInput);
     this.driftTimer = 0;
     this.driftBoostLevel = 0;
     this.driftBoostReady = false;
     
     // Play drift sound and start particle effects
     this.startDriftEffects();
   }
   
   // Update drift state if drifting
   if (this.isDrifting) {
     this.updateDrift(deltaTime, turnInput);
   }
   ```

3. **Implement drift physics and boost calculation:**
   ```typescript
   // Add to Car.ts as a new method
   private updateDrift(deltaTime: number, turnInput: number): void {
     // Continue drift only if drift button is held
     if (!this.inputManager.isDriftPressed()) {
       this.endDrift(true); // End drift and apply boost if eligible
       return;
     }
     
     // Update drift timer
     this.driftTimer += deltaTime;
     
     // Check for boost level upgrades
     for (let i = 0; i < this.driftParams.driftBoostLevels.length; i++) {
       if (this.driftTimer >= this.driftParams.driftBoostLevels[i]) {
         if (this.driftBoostLevel < i + 1) {
           this.driftBoostLevel = i + 1;
           this.driftBoostReady = true;
           this.showBoostEffect(this.driftBoostLevel); // Visual/audio cue
         }
       }
     }
     
     // Apply enhanced turning during drift
     const driftTurnFactor = this.driftParams.driftTurnMultiplier * this.driftDirection;
     const effectiveTurnInput = turnInput + (driftTurnFactor * 0.3);
     
     // Apply drift physics (tighter turning radius, slight speed reduction)
     this.rotation += effectiveTurnInput * this.turnSpeed * 1.2;
     this.speed *= 0.995; // Slight speed decrease during drift
     
     // Update wheel visuals to show drift angle
     this.updateWheelVisuals(this.driftDirection);
     
     // Update drift particle effects
     this.updateDriftParticles();
   }
   
   private endDrift(applyBoost: boolean): void {
     if (!this.isDrifting) return;
     
     this.isDrifting = false;
     
     if (applyBoost && this.driftBoostReady) {
       // Apply appropriate boost based on level
       const boostPower = this.driftParams.driftBoostPowers[this.driftBoostLevel - 1];
       this.applyBoost(boostPower);
     }
     
     // Reset drift state
     this.driftTimer = 0;
     this.driftBoostLevel = 0;
     this.driftBoostReady = false;
     
     // Stop drift effects
     this.stopDriftEffects();
     
     // Reset wheel visuals
     this.resetWheelVisuals();
   }
   ```

4. **Add boost application method:**
   ```typescript
   private applyBoost(multiplier: number): void {
     // Boost speed based on multiplier
     this.speed = Math.min(this.speed * multiplier, this.maxSpeed * 1.5);
     
     // Duration of boost effect (in seconds)
     const boostDuration = 1.0 + (this.driftBoostLevel * 0.5);
     
     // Start boost visual effects
     this.startBoostEffects(boostDuration);
     
     // Schedule end of boost effect
     setTimeout(() => {
       this.speed = Math.min(this.speed, this.maxSpeed);
     }, boostDuration * 1000);
   }
   ```

## 2. Visual Effects System

### Objectives:
- Add skid marks during drifts
- Implement particle effects (dust, sparks, boost effects)
- Create visual feedback for collisions and impacts

### Implementation Steps:

1. **Create a new `EffectsManager.ts` class:**
   ```typescript
   import * as THREE from 'three';
   
   export class EffectsManager {
     private scene: THREE.Scene;
     private skidMarks: THREE.Mesh[] = [];
     private dustParticles: THREE.Points[] = [];
     private maxSkidMarks: number = 100;
     
     constructor(scene: THREE.Scene) {
       this.scene = scene;
     }
     
     public createSkidMark(position: THREE.Vector3, rotation: number, intensity: number): void {
       // Create skid mark mesh
       const skidGeometry = new THREE.PlaneGeometry(0.3, 1.2);
       const skidMaterial = new THREE.MeshBasicMaterial({
         color: 0x333333,
         transparent: true,
         opacity: 0.7 * Math.min(intensity, 1.0),
         blending: THREE.AdditiveBlending
       });
       
       const skidMark = new THREE.Mesh(skidGeometry, skidMaterial);
       skidMark.rotation.x = -Math.PI / 2; // Flat on ground
       skidMark.rotation.z = rotation;
       skidMark.position.copy(position);
       skidMark.position.y = 0.01; // Slightly above ground
       
       this.scene.add(skidMark);
       this.skidMarks.push(skidMark);
       
       // Remove oldest skid mark if we exceed the maximum
       if (this.skidMarks.length > this.maxSkidMarks) {
         const oldestMark = this.skidMarks.shift();
         if (oldestMark) {
           this.scene.remove(oldestMark);
         }
       }
       
       // Fade out skid mark over time
       const fadeDuration = 5000 + (intensity * 3000); // 5-8 seconds based on intensity
       this.fadeOutObject(skidMark, fadeDuration);
     }
     
     public createDustEffect(position: THREE.Vector3, intensity: number, color: THREE.Color): void {
       // Create particle system for dust
       const particleCount = Math.floor(20 * intensity);
       const particles = new THREE.BufferGeometry();
       
       const positions = new Float32Array(particleCount * 3);
       const sizes = new Float32Array(particleCount);
       
       for (let i = 0; i < particleCount; i++) {
         // Random position within a small radius
         const radius = 0.3 * Math.random();
         const angle = Math.random() * Math.PI * 2;
         positions[i * 3] = position.x + (radius * Math.cos(angle));
         positions[i * 3 + 1] = position.y + Math.random() * 0.2;
         positions[i * 3 + 2] = position.z + (radius * Math.sin(angle));
         
         // Random sizes
         sizes[i] = 0.05 + Math.random() * 0.1;
       }
       
       particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
       particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
       
       const particleMaterial = new THREE.PointsMaterial({
         color: color,
         size: 0.1,
         transparent: true,
         opacity: 0.6,
         blending: THREE.AdditiveBlending
       });
       
       const particleSystem = new THREE.Points(particles, particleMaterial);
       this.scene.add(particleSystem);
       this.dustParticles.push(particleSystem);
       
       // Remove dust effect after a short duration
       setTimeout(() => {
         this.scene.remove(particleSystem);
         const index = this.dustParticles.indexOf(particleSystem);
         if (index > -1) {
           this.dustParticles.splice(index, 1);
         }
       }, 1000);
     }
     
     public createBoostEffect(position: THREE.Vector3, direction: THREE.Vector3, duration: number): void {
       // Create flame/boost effect
       // Implementation details...
     }
     
     public createCollisionEffect(position: THREE.Vector3, normal: THREE.Vector3, intensity: number): void {
       // Create sparks and debris
       // Implementation details...
     }
     
     private fadeOutObject(object: THREE.Object3D, duration: number): void {
       // If material has opacity property, animate it
       const startTime = Date.now();
       const initialOpacity = (object as THREE.Mesh).material instanceof THREE.Material 
         ? ((object as THREE.Mesh).material as THREE.Material).opacity 
         : 1.0;
       
       const animate = () => {
         const elapsed = Date.now() - startTime;
         const progress = elapsed / duration;
         
         if (progress >= 1.0) {
           this.scene.remove(object);
           const index = this.skidMarks.indexOf(object as THREE.Mesh);
           if (index > -1) {
             this.skidMarks.splice(index, 1);
           }
           return;
         }
         
         if ((object as THREE.Mesh).material instanceof THREE.Material) {
           ((object as THREE.Mesh).material as THREE.Material).opacity = initialOpacity * (1 - progress);
         }
         
         requestAnimationFrame(animate);
       };
       
       animate();
     }
   }
   ```

2. **Integrate with Car class for drift effects:**
   ```typescript
   // Add to Car.ts properties
   private effectsManager: EffectsManager;
   private lastSkidMarkTime: number = 0;
   
   // Update constructor
   constructor(scene: THREE.Scene, inputManager: InputManager, effectsManager: EffectsManager) {
     // ...existing code...
     this.effectsManager = effectsManager;
   }
   
   // Add methods for handling effects
   private updateDriftParticles(): void {
     if (!this.isDrifting || this.speed < 0.1) return;
     
     const now = Date.now();
     const timeSinceLastMark = now - this.lastSkidMarkTime;
     
     // Leave skid marks periodically based on speed
     if (timeSinceLastMark > 100 / this.speed) {
       this.lastSkidMarkTime = now;
       
       // Get wheel positions
       for (const wheel of this.wheels) {
         if (wheel.name.includes("rear")) { // Only rear wheels leave marks
           const wheelPos = new THREE.Vector3();
           wheel.getWorldPosition(wheelPos);
           wheelPos.y = 0.01; // Just above ground
           
           // Create skid mark
           const intensity = this.isDrifting ? 0.7 + (this.driftTimer * 0.1) : 0.3;
           this.effectsManager.createSkidMark(wheelPos, this.rotation, intensity);
           
           // Create dust particle effect
           const dustIntensity = this.isDrifting ? 0.5 + (this.driftTimer * 0.1) : 0.2;
           const dustColor = new THREE.Color(0x888888);
           this.effectsManager.createDustEffect(wheelPos, dustIntensity, dustColor);
         }
       }
     }
   }
   
   private showBoostEffect(level: number): void {
     // Visual cue when drift boost level increases
     const colors = [0xffff00, 0xff7700, 0xff0000]; // yellow, orange, red
     const color = new THREE.Color(colors[level - 1]);
     
     // Flash effect on kart
     // Implementation details...
     
     // TODO: Add sound effect
   }
   
   private startBoostEffects(duration: number): void {
     // Get position behind the kart
     const backPos = new THREE.Vector3(
       this.position.x - this.direction.x * 2,
       this.position.y + 0.5,
       this.position.z - this.direction.z * 2
     );
     
     // Create boost effect
     this.effectsManager.createBoostEffect(backPos, this.direction.clone().negate(), duration);
     
     // TODO: Add sound effect
   }
   ```

## 3. Health and Damage System

### Objectives:
- Implement a health system for karts
- Add visual damage indicators
- Create destruction/respawn mechanics

### Implementation Steps:

1. **Enhance the Car class with health properties:**
   ```typescript
   // Add to Car.ts properties
   private maxHealth: number = 100;
   private health: number = 100;
   private isInvulnerable: boolean = false;
   private invulnerabilityTime: number = 0;
   private isDead: boolean = false;
   private respawnTime: number = 3000; // milliseconds
   private damageModel: Record<string, THREE.Object3D> = {}; // Visual damage parts
   
   // Add health management methods
   public takeDamage(amount: number, damageSource?: THREE.Vector3): boolean {
     if (this.isInvulnerable || this.isDead) return false;
     
     this.health -= amount;
     
     // Apply visual damage
     this.updateDamageVisuals();
     
     // Apply knockback if we have a damage source
     if (damageSource) {
       this.applyKnockback(damageSource, amount);
     }
     
     // Check if destroyed
     if (this.health <= 0) {
       this.health = 0;
       this.destroy();
       return true; // Destroyed
     }
     
     // Temporary invulnerability after taking damage
     this.setInvulnerable(1000); // 1 second
     
     return false; // Not destroyed
   }
   
   private updateDamageVisuals(): void {
     const damagePercent = 1 - (this.health / this.maxHealth);
     
     // Light damage (30%+)
     if (damagePercent >= 0.3) {
       // Add dents and scratches
       if (!this.damageModel.lightDamage) {
         this.createLightDamageModel();
       }
     }
     
     // Medium damage (60%+)
     if (damagePercent >= 0.6) {
       // Add smoke effect
       if (!this.damageModel.mediumDamage) {
         this.createMediumDamageModel();
       }
     }
     
     // Heavy damage (90%+)
     if (damagePercent >= 0.9) {
       // Add fire effect
       if (!this.damageModel.heavyDamage) {
         this.createHeavyDamageModel();
       }
     }
   }
   
   private setInvulnerable(duration: number): void {
     this.isInvulnerable = true;
     this.invulnerabilityTime = duration;
     
     // Make the car slightly transparent to show invulnerability
     this.setMeshTransparency(0.5);
     
     // Reset after duration
     setTimeout(() => {
       this.isInvulnerable = false;
       this.setMeshTransparency(1.0);
     }, duration);
   }
   
   private setMeshTransparency(opacity: number): void {
     this.mesh.traverse((child) => {
       if (child instanceof THREE.Mesh && child.material) {
         if (Array.isArray(child.material)) {
           child.material.forEach((material) => {
             material.transparent = opacity < 1.0;
             material.opacity = opacity;
           });
         } else {
           child.material.transparent = opacity < 1.0;
           child.material.opacity = opacity;
         }
       }
     });
   }
   
   private destroy(): void {
     this.isDead = true;
     this.speed = 0;
     
     // Play destruction effect
     this.playDestructionEffect();
     
     // Hide the car
     this.mesh.visible = false;
     
     // Schedule respawn
     setTimeout(() => this.respawn(), this.respawnTime);
   }
   
   private respawn(): void {
     // Reset health and state
     this.health = this.maxHealth;
     this.isDead = false;
     
     // Clear damage models
     this.clearDamageModels();
     
     // Reset position (either at original spot or a spawn point)
     this.reset(); // Existing reset method
     
     // Make car visible again
     this.mesh.visible = true;
     
     // Temporary invulnerability
     this.setInvulnerable(2000); // 2 seconds of invulnerability
   }
   ```

## 4. UI System Implementation

### Objectives:
- Create health bar display
- Add speedometer and minimap
- Implement weapon/item display

### Implementation Steps:

1. **Create a new `UIManager.ts` class:**
   ```typescript
   export class UIManager {
     private healthBarElement: HTMLDivElement;
     private speedometerElement: HTMLDivElement;
     private weaponDisplayElement: HTMLDivElement;
     private minimapElement: HTMLDivElement;
     private minimapContext: CanvasRenderingContext2D | null;
     private minimapSize: number = 150;
     
     constructor() {
       this.createUIElements();
     }
     
     private createUIElements(): void {
       // Create container for all UI elements
       const uiContainer = document.createElement('div');
       uiContainer.id = 'game-ui';
       uiContainer.style.position = 'absolute';
       uiContainer.style.width = '100%';
       uiContainer.style.height = '100%';
       uiContainer.style.pointerEvents = 'none'; // Allow clicking through
       document.body.appendChild(uiContainer);
       
       // Health bar
       this.healthBarElement = document.createElement('div');
       this.healthBarElement.id = 'health-bar';
       this.healthBarElement.style.position = 'absolute';
       this.healthBarElement.style.bottom = '20px';
       this.healthBarElement.style.left = '20px';
       this.healthBarElement.style.width = '200px';
       this.healthBarElement.style.height = '20px';
       this.healthBarElement.style.backgroundColor = '#333333';
       this.healthBarElement.style.borderRadius = '10px';
       this.healthBarElement.style.overflow = 'hidden';
       
       const healthFill = document.createElement('div');
       healthFill.id = 'health-fill';
       healthFill.style.width = '100%';
       healthFill.style.height = '100%';
       healthFill.style.backgroundColor = '#00ff00';
       healthFill.style.transition = 'width 0.3s ease-in-out';
       
       this.healthBarElement.appendChild(healthFill);
       uiContainer.appendChild(this.healthBarElement);
       
       // Speedometer
       this.speedometerElement = document.createElement('div');
       this.speedometerElement.id = 'speedometer';
       this.speedometerElement.style.position = 'absolute';
       this.speedometerElement.style.bottom = '50px';
       this.speedometerElement.style.right = '20px';
       this.speedometerElement.style.fontSize = '24px';
       this.speedometerElement.style.color = '#ffffff';
       this.speedometerElement.style.fontFamily = 'Arial, sans-serif';
       this.speedometerElement.style.textShadow = '1px 1px 2px #000000';
       this.speedometerElement.textContent = '0 KM/H';
       
       uiContainer.appendChild(this.speedometerElement);
       
       // Weapon display
       this.weaponDisplayElement = document.createElement('div');
       this.weaponDisplayElement.id = 'weapon-display';
       this.weaponDisplayElement.style.position = 'absolute';
       this.weaponDisplayElement.style.bottom = '20px';
       this.weaponDisplayElement.style.right = '20px';
       this.weaponDisplayElement.style.width = '80px';
       this.weaponDisplayElement.style.height = '80px';
       this.weaponDisplayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
       this.weaponDisplayElement.style.borderRadius = '10px';
       this.weaponDisplayElement.style.display = 'flex';
       this.weaponDisplayElement.style.justifyContent = 'center';
       this.weaponDisplayElement.style.alignItems = 'center';
       this.weaponDisplayElement.style.fontSize = '48px';
       
       uiContainer.appendChild(this.weaponDisplayElement);
       
       // Minimap
       this.minimapElement = document.createElement('canvas');
       this.minimapElement.id = 'minimap';
       this.minimapElement.width = this.minimapSize;
       this.minimapElement.height = this.minimapSize;
       this.minimapElement.style.position = 'absolute';
       this.minimapElement.style.top = '20px';
       this.minimapElement.style.right = '20px';
       this.minimapElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
       this.minimapElement.style.borderRadius = '75px';
       
       uiContainer.appendChild(this.minimapElement);
       
       this.minimapContext = this.minimapElement.getContext('2d');
     }
     
     public updateHealthBar(currentHealth: number, maxHealth: number): void {
       const percentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
       const healthFill = document.getElementById('health-fill');
       
       if (healthFill) {
         healthFill.style.width = `${percentage}%`;
         
         // Change color based on health
         if (percentage > 60) {
           healthFill.style.backgroundColor = '#00ff00'; // Green
         } else if (percentage > 30) {
           healthFill.style.backgroundColor = '#ffff00'; // Yellow
         } else {
           healthFill.style.backgroundColor = '#ff0000'; // Red
         }
       }
     }
     
     public updateSpeedometer(speed: number): void {
       // Convert speed to KM/H (assuming speed is in "units per frame")
       const kmh = Math.round(speed * 100);
       this.speedometerElement.textContent = `${kmh} KM/H`;
     }
     
     public updateWeaponDisplay(weaponName: string | null, ammo: number = 0): void {
       if (!weaponName) {
         this.weaponDisplayElement.textContent = '';
         return;
       }
       
       // Can be enhanced with weapon icons instead of text
       this.weaponDisplayElement.innerHTML = `
         <div style="text-align: center;">
           <div style="font-size: 24px;">${weaponName}</div>
           <div style="font-size: 18px;">Ammo: ${ammo}</div>
         </div>
       `;
     }
     
     public updateMinimap(playerPosition: THREE.Vector3, entities: any[], mapSize: number): void {
       if (!this.minimapContext) return;
       
       const ctx = this.minimapContext;
       const scale = this.minimapSize / (mapSize * 2);
       
       // Clear minimap
       ctx.clearRect(0, 0, this.minimapSize, this.minimapSize);
       
       // Draw background
       ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
       ctx.beginPath();
       ctx.arc(this.minimapSize / 2, this.minimapSize / 2, this.minimapSize / 2, 0, Math.PI * 2);
       ctx.fill();
       
       // Draw entities
       entities.forEach(entity => {
         const relativeX = (entity.position.x - playerPosition.x) * scale + this.minimapSize / 2;
         const relativeZ = (entity.position.z - playerPosition.z) * scale + this.minimapSize / 2;
         
         ctx.beginPath();
         ctx.arc(relativeX, relativeZ, 3, 0, Math.PI * 2);
         
         // Different colors for different entity types
         switch (entity.type) {
           case 'player':
             ctx.fillStyle = '#ff0000';
             break;
           case 'itemBox':
             ctx.fillStyle = '#ffff00';
             break;
           case 'obstacle':
             ctx.fillStyle = '#ffffff';
             break;
           default:
             ctx.fillStyle = '#888888';
         }
         
         ctx.fill();
       });
       
       // Draw player (center)
       ctx.beginPath();
       ctx.arc(this.minimapSize / 2, this.minimapSize / 2, 5, 0, Math.PI * 2);
       ctx.fillStyle = '#00ff00';
       ctx.fill();
     }
   }
   ```

2. **Integrate UI with Game class:**
   ```typescript
   // Add to Game.ts properties
   private uiManager: UIManager;
   
   // Add to Game constructor
   constructor() {
     // ...existing code...
     this.uiManager = new UIManager();
   }
   
   // Update animate method
   private animate(): void {
     requestAnimationFrame(() => this.animate());
     
     if (!this.gameOver) {
       // Update game state
       this.car.update();
       this.world.update(this.car.getPosition());
       this.updateCamera();
       this.checkCollisions();
       
       // Update UI
       this.uiManager.updateHealthBar(this.car.getHealth(), this.car.getMaxHealth());
       this.uiManager.updateSpeedometer(this.car.getSpeed());
       this.uiManager.updateWeaponDisplay(this.car.getCurrentWeapon(), this.car.getCurrentAmmo());
       
       // Update minimap
       const entities = this.world.getEntitiesForMinimap(this.car.getPosition(), 200);
       this.uiManager.updateMinimap(this.car.getPosition(), entities, this.world.getWorldSize());
     }
     
     // Handle restart input
     if (this.gameOver && this.inputManager.isKeyPressed('r')) {
       this.restartGame();
     }
     
     // Render scene
     this.renderer.render(this.scene, this.camera);
   }
   ```

3. **Add required methods to Car class:**
   ```typescript
   // Add to Car class
   public getHealth(): number {
     return this.health;
   }
   
   public getMaxHealth(): number {
     return this.maxHealth;
   }
   
   public getSpeed(): number {
     return this.speed;
   }
   
   public getCurrentWeapon(): string | null {
     // Until weapons are implemented
     return null;
   }
   
   public getCurrentAmmo(): number {
     // Until weapons are implemented
     return 0;
   }
   ```

4. **Add required method to World class:**
   ```typescript
   // Add to World class
   public getEntitiesForMinimap(playerPosition: THREE.Vector3, radius: number): any[] {
     const entities: any[] = [];
     
     // Return empty array for now
     // Will be populated with actual entities once we implement them
     
     return entities;
   }
   
   public getWorldSize(): number {
     return this.worldSize;
   }
   ```