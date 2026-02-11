// Car.ts - Handles car physics, controls, and rendering
import * as THREE from 'three';
import { InputManager } from '../utils/InputManager';
import { GAME_CONFIG } from '../config/constants';

export class Car {
  private mesh: THREE.Group;
  private inputManager: InputManager;
  private position: THREE.Vector3;
  private direction: THREE.Vector3;
  private rotation: number = 0; // Rotation in radians
  private speed: number = 0;
  private maxSpeed: number = GAME_CONFIG.CAR_MAX_SPEED;
  private currentMaxSpeed: number = GAME_CONFIG.CAR_MAX_SPEED; // For temporary speed effects
  private acceleration: number = GAME_CONFIG.CAR_ACCELERATION;
  private deceleration: number = GAME_CONFIG.CAR_DECELERATION;
  private turnSpeed: number = GAME_CONFIG.CAR_TURN_SPEED;
  private distanceTraveled: number = 0;
  private initialPosition: THREE.Vector3;
  private wheels: THREE.Mesh[] = [];
  private health: number = 100; // Add health property for damage handling
  private slowEffectEndTime: number = 0; // When the slow effect ends

  // Performance optimization
  private previousPosition: THREE.Vector3;
  private targetPosition: THREE.Vector3;
  private previousRotation: number = 0;
  private targetRotation: number = 0;

  constructor(scene: THREE.Scene, inputManager: InputManager) {
    this.inputManager = inputManager;
    this.mesh = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, 0);
    this.initialPosition = this.position.clone();
    this.direction = new THREE.Vector3(0, 0, 1); // Forward direction (Z+)

    // For interpolation
    this.previousPosition = this.position.clone();
    this.targetPosition = this.position.clone();

    this.createCarModel();
    scene.add(this.mesh);
  }

  private createCarModel(): void {
    // Create more visually appealing car with vertex colors and details

    // Car body - with a sleeker design
    const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
    // Add slight gradient to the car body
    const bodyColors = new Float32Array(bodyGeometry.attributes.position.count * 3);
    const positions = bodyGeometry.attributes.position.array;

    for (let i = 0; i < bodyGeometry.attributes.position.count; i++) {
      const i3 = i * 3;
      const z = positions[i3 + 2]; // Use z-position for gradient
      const y = positions[i3 + 1]; // Use y-position for top/bottom distinction

      // Create a subtle gradient from front to back
      const baseColor = new THREE.Color(0xdd0000); // Base red color
      let color;

      // Car top is slightly darker
      if (y > 0.3) {
        color = new THREE.Color(0x990000);
      } else {
        // Add gradient from front to back
        const t = (z + 2) / 4; // Normalize z to 0-1
        color = baseColor.clone().multiplyScalar(1.0 - t * 0.2);
      }

      bodyColors[i3] = color.r;
      bodyColors[i3 + 1] = color.g;
      bodyColors[i3 + 2] = color.b;
    }

    bodyGeometry.setAttribute('color', new THREE.BufferAttribute(bodyColors, 3));
    const bodyMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true,
    });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 0.5;
    this.mesh.add(carBody);

    // Car roof with aerodynamic slope
    const roofGeometry = new THREE.BoxGeometry(1.5, 0.5, 2);
    // Manipulate vertices to create a sloped roof
    const roofPositions = roofGeometry.attributes.position.array;
    for (let i = 0; i < roofGeometry.attributes.position.count; i++) {
      const i3 = i * 3;
      const z = roofPositions[i3 + 2];
      // If this is a vertex at the front of the roof, raise it
      if (z > 0) {
        roofPositions[i3 + 1] -= 0.25; // Lower front for aerodynamic look
      }
    }
    roofGeometry.attributes.position.needsUpdate = true;
    roofGeometry.computeVertexNormals(); // Recalculate normals

    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x990000 });
    const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
    carRoof.position.set(0, 1.25, -0.7);
    this.mesh.add(carRoof);

    // Add vehicle details
    this.addVehicleDetails();

    // Wheels with better tread detail
    this.createWheels();

    // Position car at origin
    this.mesh.position.copy(this.position);

    // Set up shadows - only enable shadow casting for the main body parts
    carBody.castShadow = true;
    carRoof.castShadow = true;
  }

  private addVehicleDetails(): void {
    // Add windows with a shiny glass appearance
    const windshieldGeometry = new THREE.PlaneGeometry(1.4, 0.7);
    const windowMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });

    // Windshield
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(0, 1.15, 0.3);
    windshield.rotation.x = Math.PI / 2.5;
    this.mesh.add(windshield);

    // Side windows
    const sideWindowGeometry = new THREE.PlaneGeometry(2, 0.5);
    const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow.position.set(-1.01, 1, -0.7);
    leftWindow.rotation.y = Math.PI / 2;
    this.mesh.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow.position.set(1.01, 1, -0.7);
    rightWindow.rotation.y = -Math.PI / 2;
    this.mesh.add(rightWindow);

    // Add bumper with different color
    const bumperGeometry = new THREE.BoxGeometry(1.9, 0.4, 0.5);
    const bumperMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
    frontBumper.position.set(0, 0.3, 1.8);
    this.mesh.add(frontBumper);

    const backBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
    backBumper.position.set(0, 0.3, -1.8);
    this.mesh.add(backBumper);

    // Front lights - with actual light sources for better visuals
    this.createHeadlights();

    // Add spoiler
    const spoilerLegGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
    const spoilerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    const leftLeg = new THREE.Mesh(spoilerLegGeometry, spoilerMaterial);
    leftLeg.position.set(-0.6, 0.8, -1.8);
    this.mesh.add(leftLeg);

    const rightLeg = new THREE.Mesh(spoilerLegGeometry, spoilerMaterial);
    rightLeg.position.set(0.6, 0.8, -1.8);
    this.mesh.add(rightLeg);

    const spoilerWingGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.4);
    const spoilerWing = new THREE.Mesh(spoilerWingGeometry, spoilerMaterial);
    spoilerWing.position.set(0, 1, -1.8);
    this.mesh.add(spoilerWing);
  }

  private createHeadlights(): void {
    // Create better looking headlights
    const lightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
    lightGeometry.rotateX(Math.PI / 2);

    // Headlight texture material
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffee });

    // Left headlight
    const leftLight = new THREE.Mesh(lightGeometry, lightMaterial);
    leftLight.position.set(-0.7, 0.5, 2);
    this.mesh.add(leftLight);

    // Right headlight
    const rightLight = new THREE.Mesh(lightGeometry, lightMaterial);
    rightLight.position.set(0.7, 0.5, 2);
    this.mesh.add(rightLight);

    // Add glow to headlights for more visual interest
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    const leftGlow = new THREE.Mesh(lightGeometry.clone().scale(1.2, 1, 2), glowMaterial);
    leftGlow.position.copy(leftLight.position);
    leftGlow.position.z += 0.2; // Extend slightly forward
    this.mesh.add(leftGlow);

    const rightGlow = new THREE.Mesh(lightGeometry.clone().scale(1.2, 1, 2), glowMaterial);
    rightGlow.position.copy(rightLight.position);
    rightGlow.position.z += 0.2; // Extend slightly forward
    this.mesh.add(rightGlow);

    // Add tail lights
    const tailLightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8);
    tailLightGeometry.rotateX(Math.PI / 2);
    const tailLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Left tail light
    const leftTail = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
    leftTail.position.set(-0.7, 0.5, -2);
    leftTail.rotation.x = Math.PI;
    this.mesh.add(leftTail);

    // Right tail light
    const rightTail = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
    rightTail.position.set(0.7, 0.5, -2);
    rightTail.rotation.x = Math.PI;
    this.mesh.add(rightTail);
  }

  private createWheels(): void {
    // Improved wheels with tread patterns
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);

    // Create a more interesting wheel with treads
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const wheelPositions = [
      { x: -1, y: 0, z: 1.2, name: 'frontLeft', steer: true },
      { x: 1, y: 0, z: 1.2, name: 'frontRight', steer: true },
      { x: -1, y: 0, z: -1.2, name: 'rearLeft', steer: false },
      { x: 1, y: 0, z: -1.2, name: 'rearRight', steer: false }
    ];

    wheelPositions.forEach(pos => {
      // Create wheel
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.name = pos.name;
      wheel.castShadow = true;

      // Add wheel rim
      const rimGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.41, 8);
      rimGeometry.rotateZ(Math.PI / 2);
      const rimMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      wheel.add(rim);

      this.mesh.add(wheel);
      this.wheels.push(wheel);
    });
  }

  // Update method now accepts delta time for fixed timestep
  public update(deltaTime: number = 1 / 60): void {
    // Store previous state for interpolation
    this.previousPosition.copy(this.position);
    this.previousRotation = this.rotation;

    // Check if slow effect has expired
    this.updateSpeedEffects();

    // Get input
    const forwardInput = this.inputManager.getForwardInput();
    const turnInput = this.inputManager.getTurnInput();

    // Scale acceleration by delta time for consistency
    const scaledAcceleration = this.acceleration * (deltaTime * 60); // normalized to 60fps
    const scaledDeceleration = this.deceleration * (deltaTime * 60);

    // Apply acceleration/deceleration based on input
    if (forwardInput > 0) {
      // Accelerate forward
      this.speed += scaledAcceleration;
    } else if (forwardInput < 0) {
      // Accelerate backward
      this.speed -= scaledAcceleration;
    } else {
      // Decelerate when no input
      if (this.speed > 0) {
        this.speed -= scaledDeceleration;
        if (this.speed < 0) this.speed = 0;
      } else if (this.speed < 0) {
        this.speed += scaledDeceleration;
        if (this.speed > 0) this.speed = 0;
      }
    }

    // Cap speed at current max
    if (this.speed > this.currentMaxSpeed) this.speed = this.currentMaxSpeed;
    if (this.speed < -this.currentMaxSpeed / 2) this.speed = -this.currentMaxSpeed / 2;

    if (Math.abs(this.speed) > 0.01) {
      // Scale turning speed with car speed for better handling
      const speedFactor = Math.abs(this.speed) / this.maxSpeed;
      const scaledTurnSpeed = this.turnSpeed * speedFactor * (deltaTime * 60);

      // Only allow turning when the car is moving
      this.rotation += turnInput * scaledTurnSpeed * (this.speed > 0 ? 1 : -1);

      // Update direction vector based on rotation
      this.direction.x = Math.sin(this.rotation);
      this.direction.z = Math.cos(this.rotation);

      // Turn front wheels for visual effect - simpler version
      this.wheels.forEach(wheel => {
        if (wheel.name.startsWith('front')) {
          wheel.rotation.y = turnInput * Math.PI / 8;
        }
      });

      // Animate wheel rotation - simplified, less frequent updates
      const wheelRotationSpeed = this.speed * 0.8 * (deltaTime * 60);
      this.wheels.forEach(wheel => {
        wheel.rotation.x += wheelRotationSpeed;

        if (wheel.name.startsWith('front')) {
          wheel.rotation.y = turnInput * Math.PI / 6;
        }
      });
    }

    // Move car based on speed and direction - scale by delta time
    this.position.x += this.direction.x * this.speed;
    this.position.z += this.direction.z * this.speed;

    // Store target state for interpolation
    this.targetPosition.copy(this.position);
    this.targetRotation = this.rotation;

    // Update mesh position and rotation - will be interpolated in render
    this.updateVisualPosition(1.0); // Full interpolation on physics update

    // Update distance traveled for score
    if (this.speed > 0) {
      this.distanceTraveled += this.speed;
    }
  }

  // New method to interpolate visual position - called from render loop
  public interpolatePosition(alpha: number): void {
    this.updateVisualPosition(alpha);
  }

  // Update the visual position of the car mesh with interpolation
  private updateVisualPosition(alpha: number): void {
    // Interpolate position
    this.mesh.position.lerpVectors(this.previousPosition, this.targetPosition, alpha);

    // Interpolate rotation - handle potential angle wrapping
    let rotDiff = this.targetRotation - this.previousRotation;

    // Handle angle wrapping (keep rotation differences in -PI to PI range)
    if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;

    this.mesh.rotation.y = this.previousRotation + rotDiff * alpha;
  }

  // Update any active speed effects
  private updateSpeedEffects(): void {
    const now = Date.now();

    // Check if slow effect has expired
    if (this.slowEffectEndTime > 0 && now >= this.slowEffectEndTime) {
      // Reset to normal max speed
      this.currentMaxSpeed = this.maxSpeed;
      this.slowEffectEndTime = 0;
    }
  }

  // Method to apply a slow effect to the car - simplified
  public applySlowEffect(speedFactor: number, duration: number = 1000): void {
    // Apply speed reduction factor (0.7 means 70% of normal speed)
    this.currentMaxSpeed = this.maxSpeed * speedFactor;

    // Set when the effect will end
    this.slowEffectEndTime = Date.now() + duration;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public setPosition(newPosition: THREE.Vector3): void {
    this.position.copy(newPosition);
    this.previousPosition.copy(newPosition);
    this.targetPosition.copy(newPosition);
    this.mesh.position.copy(this.position);

    // Update initial position for reset
    this.initialPosition.copy(newPosition);
  }

  public setTerrainHeight(height: number): void {
    // Adjust the car's Y position based on terrain height
    // Adding a small offset to keep the car above the ground
    this.position.y = height + 0.5;
    this.previousPosition.y = this.position.y;
    this.targetPosition.y = this.position.y;
    this.mesh.position.y = this.position.y;
  }

  public getDirection(): THREE.Vector3 {
    return this.direction.clone();
  }

  public getDistanceTraveled(): number {
    return this.distanceTraveled;
  }

  public stop(): void {
    this.speed = 0;
  }

  // Add takeDamage method to handle damage from hazards - simplified
  public takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  // Add getter for health
  public getHealth(): number {
    return this.health;
  }

  // Update the reset method to also reset health
  public reset(): void {
    this.position.copy(this.initialPosition);
    this.previousPosition.copy(this.initialPosition);
    this.targetPosition.copy(this.initialPosition);
    this.direction.set(0, 0, 1);
    this.rotation = 0;
    this.previousRotation = 0;
    this.targetRotation = 0;
    this.speed = 0;
    this.currentMaxSpeed = this.maxSpeed; // Reset to normal speed
    this.slowEffectEndTime = 0;
    this.distanceTraveled = 0;
    this.health = 100; // Reset health
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  public getCollider(): THREE.Box3 {
    return new THREE.Box3().setFromObject(this.mesh);
  }
}