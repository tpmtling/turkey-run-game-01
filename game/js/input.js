// Turkey Run — keyboard, mouse and touch input. Actions are edge-triggered
// (pressedThisFrame) so a held key never double-fires a jump.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.pointerDown = false;
    this.pointerPressed = false;
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.pointerDown = true;
      this.pointerPressed = true;
    });
    window.addEventListener('pointerup', () => { this.pointerDown = false; });
    window.addEventListener('blur', () => this.keys.clear());
  }

  get jumpPressed() {
    return this.pressed.has('Space') || this.pressed.has('ArrowUp') || this.pressed.has('KeyW') || this.pointerPressed;
  }
  get slideHeld() {
    return this.keys.has('ArrowDown') || this.keys.has('KeyS');
  }
  get slidePressed() {
    return this.pressed.has('ArrowDown') || this.pressed.has('KeyS');
  }
  get dashPressed() {
    return this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight') || this.pressed.has('ArrowRight') || this.pressed.has('KeyD');
  }
  get confirmPressed() {
    return this.pressed.has('Enter') || this.pressed.has('Space') || this.pointerPressed;
  }
  get restartPressed() {
    return this.pressed.has('KeyR') || this.pressed.has('Enter') || this.pressed.has('Space') || this.pointerPressed;
  }
  get pausePressed() { return this.pressed.has('KeyP') || this.pressed.has('Escape'); }
  get mutePressed() { return this.pressed.has('KeyM'); }

  endFrame() {
    this.pressed.clear();
    this.pointerPressed = false;
  }
}
