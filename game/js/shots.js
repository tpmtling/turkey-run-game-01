// Turkey Run — deterministic screenshot staging. ?shot=title|play|caught|
// escaped&seed=N arranges one readable scene and renders a single frame,
// so the screenshots are real renders of the game's own code, stable
// across runs. Normal play never calls this.
import { GROUND_Y } from './config.js';

export function stageShot(game, shot) {
  const { turkey, farmer, world } = game;
  if (shot === 'title') {
    game.state = 'title';
    return;
  }
  if (shot === 'play') {
    game.state = 'playing';
    world.reset(7);
    world.distancePx = 9 * 40;
    world.score = 1234;
    turkey.reset();
    turkey.y = GROUND_Y - 64 - 150;
    turkey.grounded = false;
    turkey.vy = -200;
    farmer.reset();
    farmer.gap = 120;
    world.obstacles = [
      { kind: 'hay', x: 560, y: GROUND_Y - 52, w: 74, h: 52 },
      { kind: 'fence', x: 820, y: GROUND_Y - 58, w: 46, h: 58 },
      { kind: 'puddle', x: 980, y: GROUND_Y - 12, w: 130, h: 12 },
    ];
    world.knives = [
      { x: 700, y: 120, vy: 300, w: 26, h: 96, landed: false, warn: 0, targetX: 700 },
    ];
    world.pickups = [
      { kind: 'corn', x: 640, y: GROUND_Y - 150, w: 34, h: 34, taken: false },
      { kind: 'corn', x: 700, y: GROUND_Y - 190, w: 34, h: 34, taken: false },
      { kind: 'gravy', x: 920, y: GROUND_Y - 150, w: 38, h: 38, taken: false },
    ];
    return;
  }
  if (shot === 'caught') {
    game.state = 'playing';
    world.reset(7);
    world.distancePx = 742 * 40;
    world.score = 8120;
    turkey.reset();
    turkey.lives = 0;
    turkey.stumbleTimer = 0.4;
    farmer.reset();
    farmer.gap = 4;
    world.obstacles = [{ kind: 'hay', x: 700, y: GROUND_Y - 52, w: 74, h: 52 }];
    world.pickups = [];
    game.state = 'caught';
    return;
  }
  if (shot === 'escaped') {
    game.state = 'playing';
    world.reset(7);
    world.distancePx = 1800 * 40;
    world.score = 15230;
    turkey.reset();
    farmer.reset();
    farmer.gap = 210;
    world.obstacles = [];
    world.pickups = [
      { kind: 'corn', x: 700, y: GROUND_Y - 150, w: 34, h: 34, taken: false },
      { kind: 'feather', x: 820, y: GROUND_Y - 210, w: 36, h: 36, taken: false },
    ];
    game.state = 'escaped';
  }
}
