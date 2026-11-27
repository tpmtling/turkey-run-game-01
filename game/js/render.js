// Turkey Run — every pixel the player sees, drawn on one canvas. All art
// is vector shapes (no image files): a hand-drawn turkey, a chasing
// farmer, a scrolling farm that turns into a barn and then a kitchen.
import { VIEW_W, VIEW_H, GROUND_Y, TURKEY_X, STAGES } from './config.js';

function lerp(a, b, t) { return a + (b - a) * t; }
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixColor(c1, c2, t) {
  const a = hexRgb(c1), b = hexRgb(c2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      this.clouds.push({ x: (i * 197) % 1400, y: 40 + (i * 53) % 140, s: 0.7 + (i % 3) * 0.35 });
    }
  }

  stageColors(distanceM) {
    let idx = 0;
    for (let i = 0; i < STAGES.length; i++) if (distanceM >= STAGES[i].from) idx = i;
    const cur = STAGES[idx];
    const next = STAGES[Math.min(idx + 1, STAGES.length - 1)];
    const span = next.from - cur.from || 1;
    const t = idx === STAGES.length - 1 ? 0 : Math.min(1, Math.max(0, (distanceM - (next.from - 120)) / 120));
    return {
      skyTop: mixColor(cur.skyTop, next.skyTop, t),
      skyMid: mixColor(cur.skyMid, next.skyMid, t),
      skyBot: mixColor(cur.skyBot, next.skyBot, t),
      ground: mixColor(cur.ground, next.ground, t),
      groundDark: mixColor(cur.groundDark, next.groundDark, t),
      name: cur.name,
      index: idx,
    };
  }

  drawBackground(ctx, distanceM, scrollPx, dt) {
    const c = this.stageColors(distanceM);
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, c.skyTop);
    sky.addColorStop(0.55, c.skyMid);
    sky.addColorStop(1, c.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

    // Sun.
    ctx.fillStyle = 'rgba(255, 236, 170, 0.95)';
    ctx.beginPath(); ctx.arc(1080, 110, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 236, 170, 0.25)';
    ctx.beginPath(); ctx.arc(1080, 110, 78, 0, Math.PI * 2); ctx.fill();

    // Drifting clouds.
    ctx.fillStyle = 'rgba(255, 250, 240, 0.85)';
    for (const cl of this.clouds) {
      const x = ((cl.x - scrollPx * 0.08) % 1500 + 1500) % 1500 - 110;
      ctx.beginPath();
      ctx.ellipse(x, cl.y, 62 * cl.s, 20 * cl.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 40 * cl.s, cl.y + 6, 44 * cl.s, 16 * cl.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 42 * cl.s, cl.y + 7, 40 * cl.s, 14 * cl.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Far hills.
    ctx.fillStyle = 'rgba(122, 90, 60, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_W; x += 40) {
      const hx = x + scrollPx * 0.15;
      ctx.lineTo(x, GROUND_Y - 70 - 46 * Math.sin(hx * 0.006) - 22 * Math.sin(hx * 0.017 + 2));
    }
    ctx.lineTo(VIEW_W, GROUND_Y);
    ctx.closePath(); ctx.fill();

    // Stage scenery: farmhouse + trees, barn + silo, kitchen wall.
    if (c.index === 0) this.drawFarmyard(ctx, scrollPx);
    else if (c.index === 1) this.drawBarn(ctx, scrollPx);
    else this.drawKitchen(ctx, scrollPx);

    // Ground.
    ctx.fillStyle = c.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.fillStyle = c.groundDark;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 24; i++) {
      const x = ((i * 173 - scrollPx) % (VIEW_W + 80) + VIEW_W + 80) % (VIEW_W + 80) - 40;
      ctx.fillRect(x, GROUND_Y + 26 + (i % 5) * 16, 26, 4);
    }
    return c;
  }

  drawFarmyard(ctx, scrollPx) {
    // Farmhouse.
    const hx = 980 - ((scrollPx * 0.3) % 1700);
    ctx.fillStyle = '#b5502e';
    ctx.fillRect(hx, 430, 210, 170);
    ctx.fillStyle = '#7a3018';
    ctx.beginPath(); ctx.moveTo(hx - 18, 432); ctx.lineTo(hx + 105, 350); ctx.lineTo(hx + 228, 432); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(hx + 30, 480, 44, 44); ctx.fillRect(hx + 136, 480, 44, 44);
    ctx.fillStyle = '#5d2c14'; ctx.fillRect(hx + 88, 520, 34, 80);
    // Fence posts.
    ctx.fillStyle = '#8a6b45';
    for (let i = 0; i < 14; i++) {
      const x = ((i * 130 - scrollPx * 0.55) % 1500 + 1500) % 1500 - 60;
      ctx.fillRect(x, 540, 10, 60);
    }
    ctx.fillRect(0, 552, VIEW_W, 8); ctx.fillRect(0, 576, VIEW_W, 8);
    // Trees.
    for (let i = 0; i < 4; i++) {
      const x = ((i * 420 + 160 - scrollPx * 0.4) % 1500 + 1500) % 1500 - 80;
      ctx.fillStyle = '#6b4a26'; ctx.fillRect(x - 6, 500, 12, 100);
      ctx.fillStyle = '#c96f2e';
      ctx.beginPath(); ctx.arc(x, 470, 52, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e08a3c';
      ctx.beginPath(); ctx.arc(x - 24, 492, 34, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 26, 494, 30, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawBarn(ctx, scrollPx) {
    const bx = 900 - ((scrollPx * 0.3) % 1700);
    ctx.fillStyle = '#a33327';
    ctx.fillRect(bx, 420, 240, 180);
    ctx.beginPath(); ctx.moveTo(bx, 420); ctx.quadraticCurveTo(bx + 120, 330, bx + 240, 420); ctx.closePath();
    ctx.fillStyle = '#7a241b'; ctx.fill();
    ctx.fillStyle = '#f2e3c8';
    ctx.beginPath(); ctx.moveTo(bx + 120, 420); ctx.lineTo(bx + 150, 470); ctx.lineTo(bx + 90, 470); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d2c14'; ctx.fillRect(bx + 96, 500, 48, 100);
    // Silo.
    const sx = 240 - ((scrollPx * 0.3 + 700) % 1700);
    ctx.fillStyle = '#b8bcc4'; ctx.fillRect(sx, 380, 90, 220);
    ctx.fillStyle = '#8f959e';
    ctx.beginPath(); ctx.arc(sx + 45, 380, 45, Math.PI, 0); ctx.fill();
    // Hay bales.
    ctx.fillStyle = '#d9a441';
    for (let i = 0; i < 5; i++) {
      const x = ((i * 330 + 60 - scrollPx * 0.6) % 1500 + 1500) % 1500 - 70;
      ctx.beginPath(); ctx.arc(x, 578, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a67c2e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, 578, 17, 0, Math.PI * 2); ctx.stroke();
    }
  }

  drawKitchen(ctx, scrollPx) {
    // Warm wall with a window and hanging pans behind the run.
    ctx.fillStyle = 'rgba(122, 66, 44, 0.5)';
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
    ctx.fillStyle = '#f7e8c8';
    ctx.fillRect(90, 120, 190, 150);
    ctx.fillStyle = '#9fc3e0';
    ctx.fillRect(104, 134, 162, 122);
    ctx.fillStyle = '#f7e8c8';
    ctx.fillRect(180, 134, 10, 122); ctx.fillRect(104, 188, 162, 10);
    ctx.strokeStyle = '#5d2c14'; ctx.lineWidth = 6; ctx.strokeRect(90, 120, 190, 150);
    // Hanging pans.
    ctx.strokeStyle = '#3c3c44'; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const x = 480 + i * 120;
      ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 96); ctx.stroke();
      ctx.fillStyle = '#4a4a52';
      ctx.beginPath(); ctx.arc(x, 122, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e2e34';
      ctx.beginPath(); ctx.arc(x, 122, 24, 0, Math.PI * 2); ctx.fill();
    }
    // Big table on the right with a pie.
    const tx = 1010 - ((scrollPx * 0.25) % 1600);
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(tx, 480, 260, 26);
    ctx.fillRect(tx + 16, 506, 18, 94); ctx.fillRect(tx + 226, 506, 18, 94);
    ctx.fillStyle = '#c98a4b';
    ctx.beginPath(); ctx.ellipse(tx + 130, 470, 66, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a4a22';
    ctx.beginPath(); ctx.ellipse(tx + 130, 464, 52, 14, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawShadow(ctx, x, y, w, alpha) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawTurkey(ctx, turkey, time) {
    const x = turkey.x, y = turkey.y;
    const blink = turkey.invulnTimer > 0 && Math.floor(time * 14) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.35;
    this.drawShadow(ctx, x + turkey.w / 2, GROUND_Y + 8, turkey.w * 0.55, turkey.grounded ? 0.28 : 0.14);
    ctx.save();
    ctx.translate(x + turkey.w / 2, y + turkey.h / 2);
    if (turkey.sliding) {
      ctx.translate(0, 10);
      ctx.scale(1.25, 0.62);
    } else if (!turkey.grounded) {
      ctx.rotate(-0.12);
    } else if (turkey.stumbleTimer > 0) {
      ctx.rotate(0.35);
    }
    const legSwing = turkey.grounded ? Math.sin(turkey.runPhase) * 10 : 6;
    // Tail feathers, fanned.
    ctx.fillStyle = '#8a5a2b';
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(-26, -6);
      ctx.rotate(i * 0.32 - 0.5);
      ctx.beginPath(); ctx.ellipse(-14, 0, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = i === 0 ? '#c98a4b' : '#8a5a2b';
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#e08a2e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, 18); ctx.lineTo(-6 + legSwing, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 18); ctx.lineTo(8 - legSwing, 30); ctx.stroke();
    // Body.
    ctx.fillStyle = '#6b4423';
    ctx.beginPath(); ctx.ellipse(0, 2, 30, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7d5230';
    ctx.beginPath(); ctx.ellipse(4, 6, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
    // Wing.
    ctx.fillStyle = '#54331a';
    ctx.beginPath(); ctx.ellipse(-2, 4, 18, 12, -0.5, 0, Math.PI * 2); ctx.fill();
    // Head.
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.arc(26, -18, 13, 0, Math.PI * 2); ctx.fill();
    // Beak.
    ctx.fillStyle = '#f2a541';
    ctx.beginPath(); ctx.moveTo(36, -20); ctx.lineTo(50, -15); ctx.lineTo(36, -11); ctx.closePath(); ctx.fill();
    // Wattle.
    ctx.fillStyle = '#d9382b';
    ctx.beginPath(); ctx.ellipse(34, -8, 5, 8, 0.2, 0, Math.PI * 2); ctx.fill();
    // Eye.
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(29, -22, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(30.5, -22, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawFarmer(ctx, farmer, time) {
    const x = farmer.x;
    if (x < -140) return;
    const legSwing = Math.sin(farmer.runPhase) * 12;
    this.drawShadow(ctx, x + 46, GROUND_Y + 8, 46, 0.25);
    ctx.save();
    ctx.translate(x + 46, GROUND_Y - 52);
    // Legs (overalls).
    ctx.strokeStyle = '#3a5a8a'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-8 + legSwing, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(10 - legSwing, 50); ctx.stroke();
    // Body: checked shirt + overalls.
    ctx.fillStyle = '#c94f3d';
    ctx.fillRect(-22, -34, 44, 46);
    ctx.fillStyle = '#3a5a8a';
    ctx.fillRect(-20, -12, 40, 24);
    ctx.fillStyle = '#f2e3c8';
    ctx.fillRect(-20, -34, 40, 6);
    // Arm reaching forward with a pitchfork.
    ctx.strokeStyle = '#e8b88a'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(14, -24); ctx.lineTo(44, -8 + Math.sin(time * 9) * 3); ctx.stroke();
    ctx.strokeStyle = '#8a6b45'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(40, -26); ctx.lineTo(62, 6); ctx.stroke();
    ctx.strokeStyle = '#c8ccd4'; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(62 + i * 5, 6); ctx.lineTo(66 + i * 6, -12); ctx.stroke();
    }
    // Head + straw hat.
    ctx.fillStyle = '#e8b88a';
    ctx.beginPath(); ctx.arc(4, -48, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.beginPath(); ctx.ellipse(4, -58, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-8, -74, 24, 16);
    // Angry eyes + moustache.
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-4, -54); ctx.lineTo(4, -51); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -54); ctx.lineTo(4, -51); ctx.stroke();
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(-4, -40, 16, 5);
    ctx.restore();
  }

  drawObstacle(ctx, o, time) {
    if (o.kind === 'hay') {
      ctx.fillStyle = '#d9a441';
      ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a67c2e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 3, o.h / 3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(166,124,46,0.7)';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(o.x + o.w / 2, o.y + o.h / 2); ctx.lineTo(o.x + o.w / 2 + i * 14, o.y + 4); ctx.stroke();
      }
    } else if (o.kind === 'fence') {
      ctx.fillStyle = '#8a6b45';
      ctx.fillRect(o.x, o.y + 8, o.w, 8);
      ctx.fillRect(o.x, o.y + 30, o.w, 8);
      ctx.fillRect(o.x + 4, o.y, 8, o.h);
      ctx.fillRect(o.x + o.w - 12, o.y, 8, o.h);
      ctx.fillStyle = '#6b4f31';
      ctx.beginPath(); ctx.moveTo(o.x + 4, o.y); ctx.lineTo(o.x + 12, o.y - 8); ctx.lineTo(o.x + 12, o.y); ctx.closePath(); ctx.fill();
    } else if (o.kind === 'puddle') {
      ctx.fillStyle = '#7fb2d9';
      ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y + 6, o.w / 2, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(o.x + o.w / 2 - 20, o.y + 4, 26, 3, 0, 0, Math.PI * 2); ctx.fill();
    } else if (o.kind === 'oven') {
      ctx.fillStyle = '#3c3c44';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#55555e';
      ctx.fillRect(o.x + 8, o.y + 8, o.w - 16, o.h - 16);
      ctx.fillStyle = '#ff9a3c';
      ctx.fillRect(o.x + 18, o.y + 34, o.w - 36, 44);
      ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
      ctx.fillRect(o.x + 24, o.y + 40, o.w - 48, 12);
      ctx.fillStyle = '#c8ccd4';
      ctx.fillRect(o.x + 18, o.y + 88, o.w - 36, 8);
      ctx.fillStyle = '#ff6b2c';
      ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('HOT!', o.x + o.w / 2, o.y + 24);
    } else if (o.kind === 'pumpkin') {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.roll || 0);
      ctx.fillStyle = '#e07b28';
      ctx.beginPath(); ctx.ellipse(0, 0, 28, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b25a18'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, 18, 24, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(6, -34, 10, -30); ctx.stroke();
      ctx.restore();
    } else if (o.kind === 'knife-mark') {
      ctx.fillStyle = 'rgba(200, 30, 30, 0.55)';
      ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, GROUND_Y + 4, o.w / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(200, 30, 30, 0.85)';
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', o.x + o.w / 2, GROUND_Y - 12);
    }
  }

  drawKnife(ctx, k) {
    if (k.warn > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(k.warn * 18);
      ctx.fillStyle = `rgba(255, 60, 60, ${0.25 + pulse * 0.3})`;
      ctx.beginPath(); ctx.ellipse(k.targetX + 13, GROUND_Y + 4, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', k.targetX + 13, GROUND_Y - 14);
    }
    ctx.save();
    ctx.translate(k.x + 13, k.y + 48);
    ctx.rotate(k.landed ? 0.5 : 0.12);
    ctx.fillStyle = '#c8ccd4';
    ctx.beginPath(); ctx.moveTo(-8, -48); ctx.lineTo(8, -48); ctx.lineTo(4, 30); ctx.lineTo(-4, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8f959e';
    ctx.beginPath(); ctx.moveTo(-8, -48); ctx.lineTo(0, -48); ctx.lineTo(0, 30); ctx.lineTo(-4, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d2c14';
    ctx.fillRect(-7, 30, 14, 16);
    ctx.restore();
  }

  drawPickup(ctx, p, time) {
    const bob = Math.sin(time * 4 + p.x * 0.05) * 5;
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2 + bob;
    if (p.kind === 'corn') {
      ctx.fillStyle = '#ffd94a';
      ctx.beginPath(); ctx.ellipse(cx, cy, 12, 17, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8b93a';
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(cx + i * 6 - 1, cy - 12, 2, 24);
      }
      ctx.fillStyle = '#7a9a4d';
      ctx.beginPath(); ctx.moveTo(cx - 4, cy + 16); ctx.lineTo(cx - 14, cy + 26); ctx.lineTo(cx + 2, cy + 22); ctx.closePath(); ctx.fill();
    } else if (p.kind === 'gravy') {
      ctx.fillStyle = '#f2e3c8';
      ctx.beginPath(); ctx.ellipse(cx, cy, 17, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(cx - 17, cy - 8, 34, 8);
      ctx.fillStyle = '#c98a4b';
      ctx.beginPath(); ctx.ellipse(cx, cy - 8, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'feather') {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-0.5 + Math.sin(time * 3) * 0.1);
      ctx.fillStyle = '#e8b4d8';
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(0, -4, 4, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(ctx, particles) {
    for (const pt of particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
  }

  drawHud(ctx, game) {
    const { turkey, farmer, world } = game;
    ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
    ctx.fillRect(0, 0, VIEW_W, 64);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(`SCORE ${Math.floor(world.score)}`, 24, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText(`${Math.floor(world.distanceM)} m  ·  ${world.stage.name}`, 300, 39);
    // Hearts.
    for (let i = 0; i < 3; i++) {
      const hx = 640 + i * 40, hy = 30;
      ctx.fillStyle = i < turkey.lives ? '#e63946' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 4, hx - 6, hy - 14, hx, hy - 6);
      ctx.bezierCurveTo(hx + 6, hy - 14, hx + 12, hy - 4, hx, hy + 8);
      ctx.fill();
    }
    // Farmer gap bar.
    const bx = 800, bw = 240;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(bx, 22, bw, 20);
    const gapFrac = Math.max(0, farmer.gap / 220);
    ctx.fillStyle = gapFrac > 0.45 ? '#7ac74f' : gapFrac > 0.2 ? '#ffb347' : '#e63946';
    ctx.fillRect(bx, 22, bw * gapFrac, 20);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bx, 22, bw, 20);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('FARMER', bx, 16);
    // Dash cooldown.
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'right';
    const dashReady = turkey.dashCooldown <= 0;
    ctx.fillStyle = dashReady ? '#7ac74f' : 'rgba(255,255,255,0.55)';
    ctx.fillText(dashReady ? 'DASH READY  [Shift]' : `DASH ${Math.ceil(turkey.dashCooldown)}s`, VIEW_W - 24, 40);
    ctx.textAlign = 'left';
    // Stage progress strip.
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(24, VIEW_H - 26, 260, 8);
    ctx.fillStyle = '#ffd94a';
    ctx.fillRect(24, VIEW_H - 26, 260 * Math.min(1, world.distanceM / 1800), 8);
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText('ESCAPE 1800 m', 292, VIEW_H - 18);
  }

  panel(ctx, title, lines, accent) {
    ctx.fillStyle = 'rgba(20, 10, 6, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const pw = 760, ph = 150 + lines.length * 44;
    const px = (VIEW_W - pw) / 2, py = (VIEW_H - ph) / 2;
    ctx.fillStyle = '#fff8e8';
    ctx.strokeStyle = accent; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, VIEW_W / 2, py + 78);
    ctx.fillStyle = '#3a2a18';
    ctx.font = '24px sans-serif';
    lines.forEach((ln, i) => ctx.fillText(ln, VIEW_W / 2, py + 132 + i * 44));
    ctx.textAlign = 'left';
  }

  drawTitle(ctx, best) {
    const c = this.stageColors(0);
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, c.skyTop); sky.addColorStop(0.55, c.skyMid); sky.addColorStop(1, c.skyBot);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
    ctx.fillStyle = c.ground; ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    this.drawFarmyard(ctx, 0);
    // Big turkey mascot.
    ctx.save();
    ctx.translate(300, 420); ctx.scale(2.1, 2.1);
    ctx.fillStyle = '#8a5a2b';
    for (let i = -2; i <= 2; i++) {
      ctx.save(); ctx.translate(-26, -6); ctx.rotate(i * 0.32 - 0.5);
      ctx.beginPath(); ctx.ellipse(-14, 0, 22, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#6b4423';
    ctx.beginPath(); ctx.ellipse(0, 2, 30, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.arc(26, -18, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath(); ctx.moveTo(36, -20); ctx.lineTo(50, -15); ctx.lineTo(36, -11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9382b';
    ctx.beginPath(); ctx.ellipse(34, -8, 5, 8, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Farmer peeking from the right.
    ctx.save(); ctx.translate(1205, 470); ctx.scale(1.4, 1.4);
    ctx.fillStyle = '#c94f3d'; ctx.fillRect(-22, -34, 44, 46);
    ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(4, -48, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.beginPath(); ctx.ellipse(4, -58, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-8, -74, 24, 16);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 92px sans-serif';
    ctx.shadowColor = 'rgba(90,30,0,0.55)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 6;
    ctx.fillText('TURKEY RUN', VIEW_W / 2, 150);
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('— Thanksgiving Escape —', VIEW_W / 2, 205);
    ctx.fillStyle = '#fff';
    ctx.font = '26px sans-serif';
    ctx.fillText('The farmer is coming. Run 1800 m from the farmyard, through the barn,', VIEW_W / 2, 268);
    ctx.fillText('past the oven — and don’t become Thanksgiving dinner.', VIEW_W / 2, 302);
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('▶  Press ENTER or click to run', VIEW_W / 2, 522);
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText('SPACE / ↑ jump (twice in the air)   ·   ↓ slide   ·   SHIFT dash   ·   P pause   ·   M mute', VIEW_W / 2, 632);
    if (best > 0) {
      ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`Best score: ${best}`, VIEW_W / 2, 668);
    }
    ctx.textAlign = 'left';
  }

  drawEnd(ctx, kind, score, distanceM, best) {
    if (kind === 'caught') {
      this.panel(ctx, 'CAUGHT!', [
        'The farmer got you — Thanksgiving dinner it is.',
        `You ran ${Math.floor(distanceM)} m and scored ${Math.floor(score)}.`,
        best > 0 ? `Best score: ${best}` : 'Tip: jump the hay, time the knives, dash when the farmer closes in.',
        'Press R or click to run again.',
      ], '#c94f3d');
    } else {
      this.panel(ctx, 'ESCAPED!', [
        'You made it to the woods — no Thanksgiving dinner this year!',
        `You ran the full 1800 m and scored ${Math.floor(score)}.`,
        best > 0 ? `Best score: ${best}` : 'The turkey lives to gobble another day.',
        'Press R or click to run again.',
      ], '#7ac74f');
    }
  }

  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(20, 10, 6, 0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2 - 10);
    ctx.font = '24px sans-serif';
    ctx.fillText('Press P to keep running', VIEW_W / 2, VIEW_H / 2 + 40);
    ctx.textAlign = 'left';
  }

  render(game, time) {
    const ctx = this.ctx;
    const { state, turkey, farmer, world } = game;
    if (state === 'title') {
      this.drawTitle(ctx, game.best);
      return;
    }
    if (state === 'caught' || state === 'escaped') {
      this.drawScene(ctx, game, time);
      this.drawEnd(ctx, state, world.score, world.distanceM, game.best);
      return;
    }
    this.drawScene(ctx, game, time);
    if (state === 'paused') this.drawPaused(ctx);
  }

  drawScene(ctx, game, time) {
    const { turkey, farmer, world } = game;
    this.drawBackground(ctx, world.distanceM, world.distancePx, time);
    for (const o of world.obstacles) this.drawObstacle(ctx, o, time);
    for (const k of world.knives) this.drawKnife(ctx, k);
    for (const p of world.pickups) this.drawPickup(ctx, p, time);
    this.drawFarmer(ctx, farmer, time);
    this.drawTurkey(ctx, turkey, time);
    this.drawParticles(ctx, world.particles);
    this.drawHud(ctx, game);
  }
}
