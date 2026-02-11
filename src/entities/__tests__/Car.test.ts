import { describe, it, expect, beforeEach } from 'vitest';
import { Car } from '../Car';
import { InputManager } from '../../utils/InputManager';
import * as THREE from 'three';

describe('Car', () => {
    let scene: THREE.Scene;
    let inputManager: InputManager;
    let car: Car;

    beforeEach(() => {
        scene = new THREE.Scene();
        inputManager = new InputManager();
        car = new Car(scene, inputManager);
    });

    it('should initialize at origin by default', () => {
        const position = car.getPosition();
        expect(position.x).toBe(0);
        expect(position.y).toBe(0);
        expect(position.z).toBe(0);
    });

    it('should update position when set', () => {
        const newPosition = new THREE.Vector3(10, 5, 15);
        car.setPosition(newPosition);
        const position = car.getPosition();
        expect(position.x).toBe(10);
        expect(position.y).toBe(5);
        expect(position.z).toBe(15);
    });

    it('should initialize with full health', () => {
        expect(car.getHealth()).toBe(100);
    });

    it('should reduce health when taking damage', () => {
        car.takeDamage(30);
        expect(car.getHealth()).toBe(70);
    });

    it('should not have negative health', () => {
        car.takeDamage(150);
        expect(car.getHealth()).toBe(0);
    });

    it('should reset to initial state', () => {
        const initialPosition = new THREE.Vector3(5, 0, 5);
        car.setPosition(initialPosition);
        car.takeDamage(50);

        car.reset();

        expect(car.getHealth()).toBe(100);
        expect(car.getDistanceTraveled()).toBe(0);
    });

    it('should track distance traveled', () => {
        const initialDistance = car.getDistanceTraveled();
        car.update(1 / 60);
        // Distance should not increase without input
        expect(car.getDistanceTraveled()).toBe(initialDistance);
    });

    it('should stop when stop() is called', () => {
        car.stop();
        // After stopping, car should not move
        const positionBefore = car.getPosition();
        car.update(1 / 60);
        const positionAfter = car.getPosition();
        expect(positionBefore.x).toBe(positionAfter.x);
        expect(positionBefore.z).toBe(positionAfter.z);
    });
});
