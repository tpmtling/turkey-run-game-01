// Turkey Run — bootstrap, state machine and the main loop. States:
// title → playing ⇄ paused → caught | escaped → (restart) → playing.
// A ?shot= query renders one staged frame instead of looping, for the
// screenshots the entry hands in.
import { VIEW_W, VIEW_H, ESCAPE_DISTANCE_M } from './config.js';
import { SoundFX } from './audio.js';
import { Input } from './input.js';
import { Turkey, Farmer } from './entities.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7') || 7;

const sfx = new SoundFX();
const input = new Input(canvas);
const renderer = new Renderer(canvas);
const turkey = new Turkey();
const farmer = new Farmer();
const world = new World(seed);

const game = {
  state: 'title',
  turkey, farmer, world,
  best: 0,
  time: 0,
};

// Debug handle for local smoke tests (read-only state, no gameplay effect).
window.__turkeyRun = game;

try {
  game.best = Number(localStorage.getItem('turkey-run-best') || '0') || 0;
} catch { game.best = 0; }

function saveBest() {
  if (Math.floor(world.score) > game.best) {
    game.best = Math.floor(world.score);
    try { localStorage.setItem('turkey-run-best', String(game.best)); } catch { /* private mode */ }
  }
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function startRun() {
  turkey.reset();
  farmer.reset();
  world.reset((seed * 7919 + Math.floor(Math.random() * 100000)) % 2147483647);
  game.state = 'playing';
  sfx.ensure();
  sfx.click();
  announce('Running! Jump the hay, dodge the knives, outrun the farmer.');
}

function endRun(kind) {
  game.state = kind;
  saveBest();
  if (kind === 'caught') {
    sfx.caught();
    announce(`Caught! You ran ${Math.floor(world.distanceM)} metres and scored ${Math.floor(world.score)}. Press R to run again.`);
  } else {
    sfx.escaped();
    announce(`Escaped! You ran the full ${ESCAPE_DISTANCE_M} metres and scored ${Math.floor(world.score)}. Press R to run again.`);
  }
}

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

if (shot) {
  stageShot(game, shot);
  renderer.render(game, 1.2);
} else {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.time += dt;
    tick(dt);
    renderer.render(game, game.time);
    input.endFrame();
    requestAnimationFrame(loop);
  };

  const tick = (dt) => {
    if (input.mutePressed) sfx.toggleMute();
    if (game.state === 'title') {
      if (input.confirmPressed) startRun();
      return;
    }
    if (game.state === 'caught' || game.state === 'escaped') {
      if (input.restartPressed) startRun();
      return;
    }
    if (game.state === 'paused') {
      if (input.pausePressed || input.confirmPressed) game.state = 'playing';
      return;
    }
    // playing
    if (input.pausePressed) { game.state = 'paused'; return; }
    if (input.jumpPressed) turkey.jump(sfx);
    if (input.slidePressed) turkey.startSlide(sfx);
    else if (input.slideHeld && turkey.grounded) turkey.startSlide(sfx);
    if (input.dashPressed) turkey.dash(sfx);

    const speed = world.currentSpeed(turkey);
    turkey.update(dt, speed);
    const cleanRunning = turkey.stumbleTimer <= 0;
    farmer.update(dt, speed, cleanRunning);
    const events = world.update(dt, turkey, farmer, sfx);

    // Farmer footstep ticks, faster the closer he gets.
    sfx.stepTimer -= dt;
    if (sfx.stepTimer <= 0) {
      sfx.stepTimer = 0.28 + (farmer.gap / 220) * 0.5;
      if (farmer.gap < 130) sfx.step();
    }

    if (events.includes('escaped')) { endRun('escaped'); return; }
    if (turkey.lives <= 0 || farmer.caught) { endRun('caught'); return; }
    if (events.includes('hit')) {
      announce(`Ouch! ${turkey.lives} ${turkey.lives === 1 ? 'life' : 'lives'} left. The farmer is closing in!`);
    }
  };

  requestAnimationFrame(loop);
}
