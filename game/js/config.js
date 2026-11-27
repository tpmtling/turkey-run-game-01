// Turkey Run — tuning constants. One place for every number the game
// balances on, so the feel can be tuned without hunting through logic.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;

export const TURKEY_X = 300;
export const TURKEY_W = 78;
export const TURKEY_H = 64;
export const TURKEY_SLIDE_H = 38;

export const GRAVITY = 2600;
export const JUMP_VELOCITY = -980;
export const DOUBLE_JUMP_VELOCITY = -860;
export const SLIDE_TIME = 0.55;

export const BASE_SPEED = 330;
export const SPEED_PER_100M = 7;
export const MAX_SPEED = 560;
export const DASH_SPEED = 820;
export const DASH_TIME = 0.45;
export const DASH_COOLDOWN = 3.0;

export const MAX_LIVES = 3;
export const FARMER_START_GAP = 150;
export const FARMER_MAX_GAP = 220;
export const FARMER_CLOSE_ON_HIT = 34;
export const FARMER_RECOVER_PER_SEC = 3.5;
export const CORN_GAP_BONUS = 9;

export const STAGES = [
  { name: 'FARMYARD', from: 0, to: 600, skyTop: '#ffb347', skyMid: '#ff8c42', skyBot: '#ffd9a0', ground: '#7a9a4d', groundDark: '#5d7a38' },
  { name: 'THE BARN', from: 600, to: 1200, skyTop: '#8e6fb8', skyMid: '#c96f4a', skyBot: '#f2b880', ground: '#8a6b45', groundDark: '#6b4f31' },
  { name: 'THE KITCHEN', from: 1200, to: 1800, skyTop: '#7a4a3a', skyMid: '#a8664a', skyBot: '#e8b07e', ground: '#9c7a54', groundDark: '#7d5f3f' },
];

export const ESCAPE_DISTANCE_M = 1800;
export const PX_PER_METER = 40;

export const SCORE_PER_METER = 1;
export const SCORE_CORN = 50;
export const SCORE_GRAVY = 100;
export const SCORE_FEATHER = 150;
