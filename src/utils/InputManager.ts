// InputManager.ts - Manages keyboard inputs
export class InputManager {
  private keys: { [key: string]: boolean } = {};

  constructor() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
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
    if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('w')) return 1;
    if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('s')) return -1;
    return 0;
  }

  public getTurnInput(): number {
    if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('a')) return 1;
    if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('d')) return -1;
    return 0;
  }
}