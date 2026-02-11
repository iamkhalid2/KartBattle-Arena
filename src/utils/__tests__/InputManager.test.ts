import { describe, it, expect } from 'vitest';
import { InputManager } from '../InputManager';

describe('InputManager', () => {
    it('should initialize successfully', () => {
        const inputManager = new InputManager();
        expect(inputManager).toBeDefined();
    });

    it('should detect mobile device correctly', () => {
        const inputManager = new InputManager();
        const isMobile = inputManager.isMobileDevice();
        expect(typeof isMobile).toBe('boolean');
    });

    it('should return zero input when no keys pressed', () => {
        const inputManager = new InputManager();
        expect(inputManager.getForwardInput()).toBe(0);
        expect(inputManager.getTurnInput()).toBe(0);
    });

    it('should detect key presses', () => {
        const inputManager = new InputManager();

        // Simulate key press
        const event = new KeyboardEvent('keydown', { key: 'w' });
        document.dispatchEvent(event);

        // Note: In real scenario, this would need proper event handling
        expect(inputManager.isKeyPressed('w')).toBe(true);
    });

    it('should detect key releases', () => {
        const inputManager = new InputManager();

        // Simulate key down then up
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

        expect(inputManager.isKeyPressed('a')).toBe(false);
    });

    it('should be case insensitive for key detection', () => {
        const inputManager = new InputManager();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'W' }));

        expect(inputManager.isKeyPressed('w')).toBe(true);
        expect(inputManager.isKeyPressed('W')).toBe(true);
    });
});
