// Turkey Run — the two runners. The turkey is the player: it runs, jumps
// (once in the air, twice), slides, dashes and stumbles. The farmer is the
// pressure: a gap in pixels that shrinks on every mistake and grows back
// while the turkey runs clean. Gap zero means caught.
import {
  TURKEY_X, TURKEY_W, TURKEY_H, TURKEY_SLIDE_H, GROUND_Y, GRAVITY,
  JUMP_VELOCITY, DOUBLE_JUMP_VELOCITY, SLIDE_TIME, MAX_LIVES,
  FARMER_START_GAP, FARMER_MAX_GAP, FARMER_CLOSE_ON_HIT,
  FARMER_RECOVER_PER_SEC, DASH_TIME, DASH_COOLDOWN, CORN_GAP_BONUS,
} from './config.js';

export class Turkey {
  constructor() { this.reset(); }

  reset() {
    this.x = TURKEY_X;
    this.y = GROUND_Y - TURKEY_H;
    this.w = TURKEY_W;
    this.h = TURKEY_H;
    this.vy = 0;
    this.grounded = true;
    this.jumps = 0;
    this.sliding = false;
    this.slideTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.stumbleTimer = 0;
    this.invulnTimer = 0;
    this.runPhase = 0;
    this.lives = MAX_LIVES;
  }

  get footY() { return this.y + this.h; }
  get centerX() { return this.x + this.w / 2; }

  jump(sfx) {
    if (this.sliding) this.stopSlide();
    if (this.grounded) {
      this.vy = JUMP_VELOCITY;
      this.grounded = false;
      this.jumps = 1;
      sfx.jump();
      return true;
    }
    if (this.jumps < 2) {
      this.vy = DOUBLE_JUMP_VELOCITY;
      this.jumps = 2;
      sfx.doubleJump();
      return true;
    }
    return false;
  }

  startSlide(sfx) {
    if (!this.grounded || this.sliding) return false;
    this.sliding = true;
    this.slideTimer = SLIDE_TIME;
    this.h = TURKEY_SLIDE_H;
    this.y = GROUND_Y - TURKEY_SLIDE_H;
    sfx.slide();
    return true;
  }

  stopSlide() {
    this.sliding = false;
    this.h = TURKEY_H;
    this.y = GROUND_Y - TURKEY_H;
  }

  dash(sfx) {
    if (this.dashCooldown > 0 || this.dashTimer > 0) return false;
    this.dashTimer = DASH_TIME;
    this.dashCooldown = DASH_COOLDOWN;
    this.invulnTimer = Math.max(this.invulnTimer, DASH_TIME);
    sfx.dash();
    return true;
  }

  stumble() {
    this.stumbleTimer = 0.55;
    this.invulnTimer = 1.1;
    if (this.sliding) this.stopSlide();
    this.lives -= 1;
  }

  update(dt, speed) {
    this.runPhase += dt * (this.grounded ? speed / 34 : 6);
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.stumbleTimer > 0) this.stumbleTimer -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.stopSlide();
    }
    if (!this.grounded) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.footY >= GROUND_Y) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.grounded = true;
        this.jumps = 0;
      }
    }
  }
}

export class Farmer {
  constructor() { this.reset(); }

  reset() {
    this.gap = FARMER_START_GAP;
    this.runPhase = 0;
    this.grabTimer = 0;
  }

  get x() { return TURKEY_X - this.gap - 92; }
  get caught() { return this.gap <= 0; }

  onHit() {
    this.gap = Math.max(0, this.gap - FARMER_CLOSE_ON_HIT);
  }

  onCorn() {
    this.gap = Math.min(FARMER_MAX_GAP, this.gap + CORN_GAP_BONUS);
  }

  update(dt, speed, cleanRunning) {
    this.runPhase += dt * (speed / 30);
    if (cleanRunning && this.gap < FARMER_MAX_GAP) {
      this.gap = Math.min(FARMER_MAX_GAP, this.gap + FARMER_RECOVER_PER_SEC * dt);
    }
  }
}
