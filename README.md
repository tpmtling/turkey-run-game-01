# Turkey Run — Thanksgiving Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/tpmtling/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/tpmtling/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Turkey Run is a complete chase game that runs offline in a desktop browser from its own static files. You are the turkey on Thanksgiving morning: the farmer is coming with his pitchfork, the oven is already hot, and the carving knife is falling. Run 1800 metres from the farmyard, through the barn, past the kitchen — and don't become dinner.

Jump the hay bales and fences, slide under nothing but your own fear, dash past the falling knives, grab corn to keep the farmer at bay, and reach the woods. Three lives, one farmer who never stops, and a gap meter that tells you exactly how close he is.

- Keyboard and mouse: **Space / ↑** jump (twice in the air), **↓** slide, **Shift** dash, **P** pause, **M** mute. Click works too.
- Three stages that grow harder: Farmyard → The Barn → The Kitchen, with hay, fences, puddles, falling carving knives, a hot oven and rolling pumpkins.
- HUD: score, distance, stage, lives, farmer gap, dash cooldown, escape progress.
- Procedural WebAudio sound: jumps, pickups, thuds, footsteps, caught and escaped jingles. No audio files.
- All art is hand-drawn on canvas — no image assets, no libraries, no network.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network.

## Enter it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=fpwjs2j2&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
