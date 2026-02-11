// constants.ts - Centralized game configuration
export const GAME_CONFIG = {
    // World dimensions
    ARENA_SIZE: import.meta.env.VITE_ARENA_SIZE ? parseInt(import.meta.env.VITE_ARENA_SIZE) : 200,
    WORLD_SIZE: import.meta.env.VITE_WORLD_SIZE ? parseInt(import.meta.env.VITE_WORLD_SIZE) : 500,

    // Physics engine
    FIXED_TIMESTEP: 1 / 60, // Target 60 FPS (16.67ms per frame)
    MAX_SUBSTEPS: 3, // Max physics steps per frame to prevent spiral of death
    MAX_FRAME_TIME: 0.25, // Cap maximum frame time to prevent spiral of death on slow devices

    // Car physics
    CAR_MAX_SPEED: 0.5,
    CAR_ACCELERATION: 0.01,
    CAR_DECELERATION: 0.005,
    CAR_TURN_SPEED: 0.03,

    // Renderer settings
    PIXEL_RATIO: 1, // Force pixel ratio of 1 for better performance
    CAMERA_FAR: 4000, // Far clipping plane to see the entire skybox
    CAMERA_FOV: 75,
    CAMERA_NEAR: 0.1,

    // Feature flags
    SHADOW_MAP_ENABLED: true,
    STATS_ENABLED: !import.meta.env.PROD, // Show stats panel in development only
    ANTIALIAS_ENABLED: false, // Disable for performance
};
