// Car.ts - Handles car physics, controls, and rendering
import * as THREE from 'three';
import { InputManager } from '../utils/InputManager';

export class Car {
  private mesh: THREE.Group;
  private inputManager: InputManager;
  private position: THREE.Vector3;
  private direction: THREE.Vector3;
  private rotation: number = 0; // Rotation in radians
  private speed: number = 0;
  private maxSpeed: number = 0.5;
  private acceleration: number = 0.01;
  private deceleration: number = 0.005;
  private turnSpeed: number = 0.03; // How fast the car can turn
  private distanceTraveled: number = 0;
  private initialPosition: THREE.Vector3;
  private wheels: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, inputManager: InputManager) {
    this.inputManager = inputManager;
    this.mesh = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, 0);
    this.initialPosition = this.position.clone();
    this.direction = new THREE.Vector3(0, 0, 1); // Forward direction (Z+)
    
    this.createCarModel();
    scene.add(this.mesh);
  }

  private createCarModel(): void {
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 0.5;
    this.mesh.add(carBody);
    
    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.5, 0.7, 2);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xAA0000 });
    const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
    carRoof.position.set(0, 1.35, -0.5);
    this.mesh.add(carRoof);
    
    // Front lights
    const lightGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.1);
    const lightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 0.5
    });
    
    const leftLight = new THREE.Mesh(lightGeometry, lightMaterial);
    leftLight.position.set(-0.7, 0.5, 2);
    this.mesh.add(leftLight);
    
    const rightLight = new THREE.Mesh(lightGeometry, lightMaterial);
    rightLight.position.set(0.7, 0.5, 2);
    this.mesh.add(rightLight);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const wheelPositions = [
      { x: -1.1, y: 0, z: 1.2, name: 'frontLeft' },
      { x: 1.1, y: 0, z: 1.2, name: 'frontRight' },
      { x: -1.1, y: 0, z: -1.2, name: 'rearLeft' },
      { x: 1.1, y: 0, z: -1.2, name: 'rearRight' }
    ];
    
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.name = pos.name;
      this.mesh.add(wheel);
      this.wheels.push(wheel);
    });
    
    // Position car at origin
    this.mesh.position.copy(this.position);
  }

  public update(): void {
    // Get input
    const forwardInput = this.inputManager.getForwardInput();
    const turnInput = this.inputManager.getTurnInput();
    
    // Apply acceleration/deceleration based on input
    if (forwardInput > 0) {
      // Accelerate forward
      this.speed += this.acceleration;
    } else if (forwardInput < 0) {
      // Accelerate backward
      this.speed -= this.acceleration;
    } else {
      // Natural deceleration when no key is pressed
      if (this.speed > 0) {
        this.speed -= this.deceleration;
      } else if (this.speed < 0) {
        this.speed += this.deceleration;
      }
      
      // Prevent small floating-point speeds
      if (Math.abs(this.speed) < this.deceleration) {
        this.speed = 0;
      }
    }
    
    // Clamp speed
    this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));
    
    // Apply turning based on input and current speed
    if (Math.abs(this.speed) > 0.01) {
      // Only allow turning when the car is moving
      this.rotation += turnInput * this.turnSpeed * (this.speed > 0 ? 1 : -1);
      
      // Update direction vector based on rotation
      this.direction.x = Math.sin(this.rotation);
      this.direction.z = Math.cos(this.rotation);
      
      // Turn front wheels for visual effect
      this.wheels.forEach(wheel => {
        if (wheel.name.startsWith('front')) {
          wheel.rotation.y = turnInput * Math.PI / 8;
        }
      });
    }
    
    // Move car based on speed and direction
    this.position.x += this.direction.x * this.speed;
    this.position.z += this.direction.z * this.speed;
    
    // Update mesh position and rotation
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
    
    // Update distance traveled for score
    if (this.speed > 0) {
      this.distanceTraveled += this.speed;
    }
  }
  
  public getPosition(): THREE.Vector3 {
    return this.position.clone();
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
  
  public reset(): void {
    this.position.copy(this.initialPosition);
    this.direction.set(0, 0, 1);
    this.rotation = 0;
    this.speed = 0;
    this.distanceTraveled = 0;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }
  
  public getCollider(): THREE.Box3 {
    return new THREE.Box3().setFromObject(this.mesh);
  }
}