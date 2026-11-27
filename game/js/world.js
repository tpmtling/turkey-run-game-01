// Turkey Run — the world: distance, stages, spawning, movement and
// collisions. Obstacles and pickups are plain objects in arrays; the
// spawner keeps a fair gap after each pattern so the run stays readable.
import {
  VIEW_W, GROUND_Y, BASE_SPEED, SPEED_PER_100M, MAX_SPEED, DASH_SPEED,
  STAGES, ESCAPE_DISTANCE_M, PX_PER_METER, SCORE_PER_METER,
  SCORE_CORN, SCORE_GRAVY, SCORE_FEATHER, CORN_GAP_BONUS,
} from './config.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class World {
  constructor(seed) {
    this.rng = mulberry32(seed);
    this.reset(seed);
  }

  reset(seed) {
    this.rng = mulberry32(seed);
    this.distancePx = 0;
    this.score = 0;
    this.obstacles = [];
    this.pickups = [];
    this.particles = [];
    this.knives = [];
    this.spawnX = VIEW_W + 320;
    this.sinceSpawn = 0;
    this.nextGap = 420;
    this.speed = BASE_SPEED;
    this.escaped = false;
    this.stageIndex = 0;
  }

  get distanceM() { return this.distancePx / PX_PER_METER; }
  get stage() {
    const m = this.distanceM;
    let idx = 0;
    for (let i = 0; i < STAGES.length; i++) if (m >= STAGES[i].from) idx = i;
    return STAGES[idx];
  }
  get stageProgress() {
    const s = this.stage;
    return Math.min(1, Math.max(0, (this.distanceM - s.from) / (s.to - s.from)));
  }

  currentSpeed(turkey) {
    let sp = Math.min(MAX_SPEED, BASE_SPEED + SPEED_PER_100M * (this.distanceM / 100));
    if (turkey.dashTimer > 0) sp = DASH_SPEED;
    if (turkey.stumbleTimer > 0) sp *= 0.45;
    return sp;
  }

  spawnPattern() {
    const m = this.distanceM;
    const r = this.rng;
    const x = this.spawnX;
    // The first 150 m are gentle: single hay, a fence or corn only, so a
    // new player learns the jump before knives and doubles show up.
    let roll = r();
    if (m < 150) roll = roll < 0.45 ? 0.1 : roll < 0.75 ? 0.3 : 0.95;
    const inKitchen = m >= 1200;
    const inBarn = m >= 600 && m < 1200;
    if (roll < 0.24) {
      // Hay bale: jump it.
      this.obstacles.push({ kind: 'hay', x, y: GROUND_Y - 52, w: 74, h: 52 });
      if (r() < 0.5) this.pickups.push({ kind: 'corn', x: x + 130, y: GROUND_Y - 150, w: 34, h: 34, taken: false });
    } else if (roll < 0.44) {
      // Fence: jump it, low and wide.
      this.obstacles.push({ kind: 'fence', x, y: GROUND_Y - 58, w: 46, h: 58 });
      this.pickups.push({ kind: 'corn', x: x + 22, y: GROUND_Y - 150, w: 34, h: 34, taken: false });
    } else if (roll < 0.58 && m > 300) {
      // Double hay: jump twice or one long jump (only after 300 m).
      this.obstacles.push({ kind: 'hay', x, y: GROUND_Y - 52, w: 74, h: 52 });
      this.obstacles.push({ kind: 'hay', x: x + 170, y: GROUND_Y - 52, w: 74, h: 52 });
    } else if (roll < 0.70) {
      // Puddle: jump it or slog through (slows the turkey).
      this.obstacles.push({ kind: 'puddle', x, y: GROUND_Y - 12, w: 130, h: 12 });
    } else if (roll < 0.82 && m > 150) {
      // Carving knife drops from above onto a marked spot.
      const kx = x + 60;
      this.knives.push({ x: kx, y: -90, vy: 0, w: 26, h: 96, landed: false, warn: 0.85, targetX: kx });
      this.obstacles.push({ kind: 'knife-mark', x: kx - 30, y: GROUND_Y - 8, w: 60, h: 8 });
    } else if (inKitchen && roll < 0.92) {
      // Hot oven: tall, jump it late.
      this.obstacles.push({ kind: 'oven', x, y: GROUND_Y - 118, w: 96, h: 118 });
    } else if (inBarn && roll < 0.92) {
      // Rolling pumpkin: comes at the turkey, jump it.
      this.obstacles.push({ kind: 'pumpkin', x, y: GROUND_Y - 56, w: 56, h: 56, roll: 0 });
    } else {
      // Corn line: free points, sometimes a feather or gravy.
      const n = 3 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        this.pickups.push({ kind: 'corn', x: x + i * 62, y: GROUND_Y - 120 - (i % 2) * 44, w: 34, h: 34, taken: false });
      }
      if (r() < 0.22) this.pickups.push({ kind: 'gravy', x: x + n * 62 + 40, y: GROUND_Y - 150, w: 38, h: 38, taken: false });
      if (r() < 0.10) this.pickups.push({ kind: 'feather', x: x + 40, y: GROUND_Y - 210, w: 36, h: 36, taken: false });
    }
    const density = Math.min(1, 0.45 + m / 3000);
    this.nextGap = (430 + r() * 300) * (1.15 - density * 0.35);
  }

  burst(x, y, color, n, spread) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y, vx: (this.rng() - 0.5) * spread, vy: -this.rng() * 260 - 40,
        life: 0.5 + this.rng() * 0.4, maxLife: 0.9, color,
        size: 3 + this.rng() * 5,
      });
    }
  }

  // Returns events for the main loop: 'hit' | 'corn' | 'gravy' | 'feather' | 'escaped'.
  update(dt, turkey, farmer, sfx) {
    const events = [];
    const speed = this.currentSpeed(turkey);
    this.speed = speed;
    const dx = speed * dt;
    this.distancePx += dx;
    this.score += dx * (SCORE_PER_METER / PX_PER_METER);

    this.sinceSpawn += dx;
    if (this.sinceSpawn >= this.nextGap) {
      this.sinceSpawn = 0;
      this.spawnPattern();
    }

    for (const o of this.obstacles) {
      o.x -= dx;
      if (o.kind === 'pumpkin') o.roll += dx / 28;
    }
    for (const p of this.pickups) p.x -= dx;
    for (const k of this.knives) {
      k.x -= dx;
      k.targetX -= dx;
      if (k.warn > 0) {
        k.warn -= dt;
      } else if (!k.landed) {
        k.vy += 4200 * dt;
        k.y += k.vy * dt;
        if (k.y >= GROUND_Y - k.h) {
          k.y = GROUND_Y - k.h;
          k.landed = true;
          this.burst(k.x + 13, GROUND_Y, '#c8ccd4', 8, 220);
        }
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -80);
    this.pickups = this.pickups.filter((p) => p.x + p.w > -80 && !p.taken);
    this.knives = this.knives.filter((k) => k.x + k.w > -80);
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const pt of this.particles) {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 900 * dt;
    }

    // Collisions with the turkey.
    const t = { x: turkey.x + 8, y: turkey.y + 4, w: turkey.w - 16, h: turkey.h - 6 };
    if (turkey.invulnTimer <= 0) {
      for (const o of this.obstacles) {
        if (o.kind === 'knife-mark') continue;
        if (o.kind === 'puddle') {
          if (t.x < o.x + o.w && t.x + t.w > o.x && turkey.grounded) {
            // Slogging through the puddle: no hit, but the farmer gains.
            farmer.gap = Math.max(0, farmer.gap - 22 * dt);
          }
          continue;
        }
        if (t.x < o.x + o.w - 6 && t.x + t.w > o.x + 6 && t.y < o.y + o.h - 4 && t.y + t.h > o.y + 8) {
          turkey.stumble();
          farmer.onHit();
          sfx.hit();
          this.burst(turkey.centerX, turkey.y + 20, '#ffb347', 14, 320);
          events.push('hit');
          break;
        }
      }
      for (const k of this.knives) {
        // The danger is the drop, not the stuck blade: a falling knife can
        // hit, but once it sticks in the ground the turkey runs past it.
        if (!k.landed && t.x < k.x + k.w - 2 && t.x + t.w > k.x + 2 && t.y < k.y + k.h && t.y + t.h > k.y + 10) {
          turkey.stumble();
          farmer.onHit();
          sfx.hit();
          this.burst(turkey.centerX, turkey.y + 20, '#ffb347', 14, 320);
          events.push('hit');
          break;
        }
      }
    }

    for (const p of this.pickups) {
      if (p.taken) continue;
      if (t.x < p.x + p.w && t.x + t.w > p.x && t.y < p.y + p.h && t.y + t.h > p.y) {
        p.taken = true;
        if (p.kind === 'corn') {
          this.score += SCORE_CORN;
          farmer.gap = Math.min(220, farmer.gap + CORN_GAP_BONUS);
          sfx.pickup();
          events.push('corn');
        } else if (p.kind === 'gravy') {
          this.score += SCORE_GRAVY;
          sfx.pickup();
          events.push('gravy');
        } else if (p.kind === 'feather') {
          this.score += SCORE_FEATHER;
          turkey.lives = Math.min(3, turkey.lives + 1);
          sfx.feather();
          events.push('feather');
        }
        this.burst(p.x + p.w / 2, p.y + p.h / 2, '#ffd94a', 8, 200);
      }
    }

    if (this.distanceM >= ESCAPE_DISTANCE_M) {
      this.escaped = true;
      events.push('escaped');
    }
    return events;
  }
}
