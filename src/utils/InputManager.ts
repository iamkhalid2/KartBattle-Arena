// InputManager.ts - Manages keyboard inputs and touch inputs for mobile
export class InputManager {
  private keys: { [key: string]: boolean } = {};
  private isMobile: boolean = false;
  private touchForwardInput: number = 0;
  private touchTurnInput: number = 0;
  private acceleratorPressed: boolean = false;
  private brakePressed: boolean = false;
  private steeringAngle: number = 0;

  constructor() {
    // Set up keyboard controls
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Detect if device is mobile
    this.detectMobile();

    // Set up touch controls if on mobile
    if (this.isMobile) {
      this.setupTouchControls();
    }
    
    // Listen for orientation changes
    window.addEventListener('resize', () => this.checkOrientation());
    this.checkOrientation();
  }

  private detectMobile(): void {
    // Check if device is mobile based on user agent
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private setupTouchControls(): void {
    this.createMobileControls();
    
    // Setup event listeners for the controls
    const accelerator = document.getElementById('accelerator');
    const brake = document.getElementById('brake');
    const steeringWheel = document.getElementById('steering-wheel');
    
    if (accelerator) {
      accelerator.addEventListener('touchstart', () => { this.acceleratorPressed = true; });
      accelerator.addEventListener('touchend', () => { this.acceleratorPressed = false; });
    }
    
    if (brake) {
      brake.addEventListener('touchstart', () => { this.brakePressed = true; });
      brake.addEventListener('touchend', () => { this.brakePressed = false; });
    }
    
    if (steeringWheel) {
      steeringWheel.addEventListener('touchstart', (e) => { this.handleSteeringTouch(e); });
      steeringWheel.addEventListener('touchmove', (e) => { this.handleSteeringTouch(e); });
      steeringWheel.addEventListener('touchend', () => { this.steeringAngle = 0; });
    }
  }
  
  private createMobileControls(): void {
    // Create container for mobile controls
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobile-controls';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.bottom = '0';
    controlsContainer.style.left = '0';
    controlsContainer.style.width = '100%';
    controlsContainer.style.height = '150px';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.justifyContent = 'space-between';
    controlsContainer.style.pointerEvents = 'none';
    
    // Create pedals container (left side)
    const pedalsContainer = document.createElement('div');
    pedalsContainer.id = 'pedals';
    pedalsContainer.style.display = 'flex';
    pedalsContainer.style.flexDirection = 'column';
    pedalsContainer.style.justifyContent = 'flex-end';
    pedalsContainer.style.padding = '20px';
    pedalsContainer.style.pointerEvents = 'none';
    
    // Create accelerator pedal
    const accelerator = document.createElement('div');
    accelerator.id = 'accelerator';
    accelerator.style.width = '60px';
    accelerator.style.height = '60px';
    accelerator.style.borderRadius = '50%';
    accelerator.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
    accelerator.style.marginBottom = '10px';
    accelerator.style.display = 'flex';
    accelerator.style.alignItems = 'center';
    accelerator.style.justifyContent = 'center';
    accelerator.style.pointerEvents = 'auto';
    accelerator.innerHTML = 'GAS';
    
    // Create brake pedal
    const brake = document.createElement('div');
    brake.id = 'brake';
    brake.style.width = '60px';
    brake.style.height = '60px';
    brake.style.borderRadius = '50%';
    brake.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    brake.style.display = 'flex';
    brake.style.alignItems = 'center';
    brake.style.justifyContent = 'center';
    brake.style.pointerEvents = 'auto';
    brake.innerHTML = 'BRAKE';
    
    // Create steering wheel container (right side)
    const steeringContainer = document.createElement('div');
    steeringContainer.style.display = 'flex';
    steeringContainer.style.alignItems = 'flex-end';
    steeringContainer.style.padding = '20px';
    steeringContainer.style.pointerEvents = 'none';
    
    // Create steering wheel
    const steeringWheel = document.createElement('div');
    steeringWheel.id = 'steering-wheel';
    steeringWheel.style.width = '100px';
    steeringWheel.style.height = '100px';
    steeringWheel.style.borderRadius = '50%';
    steeringWheel.style.border = '8px solid rgba(200, 200, 200, 0.7)';
    steeringWheel.style.backgroundColor = 'rgba(100, 100, 100, 0.5)';
    steeringWheel.style.pointerEvents = 'auto';
    steeringWheel.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">⟳</div>';
    
    // Add controls to the DOM
    pedalsContainer.appendChild(accelerator);
    pedalsContainer.appendChild(brake);
    steeringContainer.appendChild(steeringWheel);
    controlsContainer.appendChild(pedalsContainer);
    controlsContainer.appendChild(steeringContainer);
    document.body.appendChild(controlsContainer);
    
    // Create the orientation prompt (hidden by default)
    const orientationPrompt = document.createElement('div');
    orientationPrompt.id = 'orientation-prompt';
    orientationPrompt.style.position = 'fixed';
    orientationPrompt.style.top = '0';
    orientationPrompt.style.left = '0';
    orientationPrompt.style.width = '100%';
    orientationPrompt.style.height = '100%';
    orientationPrompt.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    orientationPrompt.style.color = 'white';
    orientationPrompt.style.display = 'flex';
    orientationPrompt.style.flexDirection = 'column';
    orientationPrompt.style.justifyContent = 'center';
    orientationPrompt.style.alignItems = 'center';
    orientationPrompt.style.zIndex = '1000';
    orientationPrompt.style.display = 'none';
    
    const promptIcon = document.createElement('div');
    promptIcon.innerHTML = '↔️';
    promptIcon.style.fontSize = '48px';
    promptIcon.style.marginBottom = '20px';
    
    const promptText = document.createElement('p');
    promptText.textContent = 'Please rotate your device to landscape mode for the best experience.';
    promptText.style.fontSize = '18px';
    promptText.style.textAlign = 'center';
    promptText.style.margin = '0 20px';
    
    orientationPrompt.appendChild(promptIcon);
    orientationPrompt.appendChild(promptText);
    document.body.appendChild(orientationPrompt);

    // Create a fullscreen button
    const fullscreenBtn = document.createElement('div');
    fullscreenBtn.id = 'fullscreen-btn';
    fullscreenBtn.style.position = 'absolute';
    fullscreenBtn.style.top = '20px';
    fullscreenBtn.style.right = '20px';
    fullscreenBtn.style.width = '40px';
    fullscreenBtn.style.height = '40px';
    fullscreenBtn.style.backgroundColor = 'rgba(50, 50, 50, 0.7)';
    fullscreenBtn.style.borderRadius = '5px';
    fullscreenBtn.style.display = 'flex';
    fullscreenBtn.style.justifyContent = 'center';
    fullscreenBtn.style.alignItems = 'center';
    fullscreenBtn.style.cursor = 'pointer';
    fullscreenBtn.style.zIndex = '100';
    fullscreenBtn.innerHTML = '⛶';
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    document.body.appendChild(fullscreenBtn);
  }

  private handleSteeringTouch(event: TouchEvent): void {
    event.preventDefault();
    
    const steeringWheel = document.getElementById('steering-wheel');
    if (!steeringWheel) return;
    
    const touch = event.touches[0];
    const wheelRect = steeringWheel.getBoundingClientRect();
    const wheelCenterX = wheelRect.left + wheelRect.width / 2;
    
    // Calculate horizontal distance from center of wheel
    const touchX = touch.clientX;
    const deltaX = touchX - wheelCenterX;
    
    // Normalize to get a value between -1 and 1
    const maxDistance = wheelRect.width / 2;
    this.steeringAngle = Math.max(-1, Math.min(1, deltaX / maxDistance));
  }

  private checkOrientation(): void {
    if (!this.isMobile) return;
    
    const orientationPrompt = document.getElementById('orientation-prompt');
    if (!orientationPrompt) return;
    
    // Check if device is in portrait mode
    if (window.innerHeight > window.innerWidth) {
      orientationPrompt.style.display = 'flex';
    } else {
      orientationPrompt.style.display = 'none';
    }
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys[event.key.toLowerCase()] = true;
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys[event.key.toLowerCase()] = false;
  }

  public isKeyPressed(key: string): boolean {
    return this.keys[key.toLowerCase()] === true;
  }

  // For car controls
  public getForwardInput(): number {
    if (this.isMobile) {
      // Mobile controls
      if (this.acceleratorPressed) return 1;
      if (this.brakePressed) return -1;
      return 0;
    } else {
      // Keyboard controls
      if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('w')) return 1;
      if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('s')) return -1;
      return 0;
    }
  }

  public getTurnInput(): number {
    if (this.isMobile) {
      // Mobile controls - return steering wheel angle
      return this.steeringAngle;
    } else {
      // Keyboard controls
      if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('a')) return 1;
      if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('d')) return -1;
      return 0;
    }
  }

  public isMobileDevice(): boolean {
    return this.isMobile;
  }
}