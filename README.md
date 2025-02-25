# 3D City Scene with Three.js

An interactive 3D city scene built with Three.js that features procedurally generated buildings, day/night cycles, and environmental elements.

## Features

- Procedurally generated city layout with skyscrapers, apartment buildings, and shops
- Dynamic day/night cycle with lighting changes
- Environmental elements including trees, lampposts, and benches
- Interactive camera controls (orbit, pan, zoom)
- Time control system with adjustable speed

## Getting Started

### Running the Project

1. Clone or download this repository
2. Open the project folder
3. Open `index.html` in a modern web browser (Chrome, Firefox, or Edge recommended)

No build process is required as the project uses ES modules with CDN-loaded dependencies.

## Controls

### Camera Controls

- Left Click + Drag: Rotate the camera around the city
- Right Click + Drag: Pan the camera
- Scroll Wheel: Zoom in/out
- The camera is constrained to prevent going below ground level

### Time Controls

- Toggle Time Speed: Switch between normal speed, fast speed, and paused
- Day: Set the time to midday (12:00 PM)
- Night: Set the time to night (10:00 PM)

## Implementation Details

The project is structured as follows:

- `js/scene.js`: Main scene management
- `js/buildings/`: Building generation system
- `js/lighting/`: Day/night cycle and lighting effects
- `js/environment/`: Environmental elements (trees, lampposts, benches)

## Future Enhancements

Planned features for future development:

- Road network with traffic system
- Moving vehicles following roads
- Pedestrians walking on sidewalks
- Weather effects (rain, snow)
- Sound effects and ambient audio

## Technical Details

This project uses:

- Three.js for 3D rendering
- ES6+ JavaScript features
- CSS for UI styling
- HTML5 for page structure

## Performance Tips

For optimal performance:

- Use a modern browser with WebGL support
- Close other resource-intensive applications
- If experiencing lag, try reducing the browser window size

## License

This project is available for educational and personal use.

## Acknowledgments

- Three.js team for their excellent 3D library
- All developers contributing to open-source libraries used in this project