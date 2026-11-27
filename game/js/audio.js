// Turkey Run — procedural sound. No audio files: every effect is a few
// oscillators and a noise burst through WebAudio, built lazily on the
// first user gesture so browsers allow it. M toggles mute.
export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.stepTimer = 0;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol, lowpass) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  jump() { this.tone(320, 0.16, 'square', 0.10, 640); }
  doubleJump() { this.tone(420, 0.14, 'square', 0.09, 840); }
  slide() { this.noise(0.12, 0.08, 900); }
  dash() { this.noise(0.22, 0.12, 2400); this.tone(180, 0.2, 'sawtooth', 0.06, 520); }
  pickup() { this.tone(880, 0.09, 'sine', 0.12); setTimeout(() => this.tone(1318, 0.12, 'sine', 0.10), 70); }
  feather() { [660, 880, 1100, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.11), i * 70)); }
  hit() { this.noise(0.25, 0.22, 500); this.tone(140, 0.3, 'sawtooth', 0.16, 55); }
  step() { this.noise(0.05, 0.05, 300); }
  caught() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.28, 'triangle', 0.13), i * 170)); }
  escaped() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.12), i * 110)); }
  click() { this.tone(700, 0.06, 'sine', 0.08); }
}
