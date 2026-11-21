// scenes.js — the game's original art: three hand-drawn canvas scenes.
// Each scene has a drawBase(ctx) that paints the picture, and a list of
// differences. A difference is a spot (x, y, r) in panel coordinates plus a
// drawRight(ctx) that repaints just that spot on the right panel. The left
// panel shows drawBase alone; the right panel is drawBase with every
// difference's drawRight painted over it, so the two panels differ only
// where a difference says so. All art is drawn with canvas shapes — no
// images, no copied art, no commercial names.

export const PANEL_W = 560;
export const PANEL_H = 560;

// ---- small shape helpers (all drawing goes through these) ----
function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function strokeLine(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function curve(ctx, points, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i + 2 < points.length; i += 2) {
    ctx.quadraticCurveTo(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  ctx.stroke();
}

function text(ctx, str, x, y, size, fill, align = 'center', weight = 'bold') {
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// A four-point sparkle star.
function sparkle(ctx, x, y, r, fill) {
  poly(ctx, [[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28],
    [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], fill);
}

function paperLantern(ctx, x, y, color) {
  ellipse(ctx, x, y, 20, 26, color);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  for (const dy of [-14, -5, 5, 14]) {
    ctx.beginPath();
    ctx.ellipse(x, y + dy, 19 - Math.abs(dy) * 0.45, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  rect(ctx, x - 6, y - 30, 12, 6, '#8a6d3b');
  rect(ctx, x - 6, y + 24, 12, 6, '#8a6d3b');
}

// ===================================================================
// Scene 1 — Night Market. 7 differences, 120 seconds, 2 hints.
// ===================================================================
function marketSky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 380);
  g.addColorStop(0, '#1b2350');
  g.addColorStop(0.55, '#5b3a7d');
  g.addColorStop(1, '#e08a5a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL_W, 380);
}

function drawMarketBase(ctx) {
  marketSky(ctx);
  // Stars.
  for (const [x, y, r] of [[60, 50, 3], [150, 90, 2], [220, 40, 3], [300, 64, 5], [360, 110, 2],
    [420, 40, 3], [500, 130, 2], [90, 140, 2], [260, 130, 2]]) {
    sparkle(ctx, x, y, r, '#fff8c9');
  }
  // Crescent moon (difference: full moon on the right).
  circle(ctx, 472, 82, 24, '#ffe9a8');
  circle(ctx, 486, 74, 20, '#3a3670');
  // String lights sagging between two poles.
  strokeLine(ctx, 20, 120, 280, 168, '#2c2430', 3);
  strokeLine(ctx, 280, 168, 540, 120, '#2c2430', 3);
  for (const [x, y, c] of [[60, 132, '#ffd166'], [120, 146, '#ef476f'], [180, 158, '#06d6a0'],
    [240, 166, '#ffd166'], [320, 166, '#ef476f'], [380, 154, '#06d6a0'], [440, 140, '#ffd166'], [500, 128, '#ef476f']]) {
    circle(ctx, x, y + 8, 7, c);
    circle(ctx, x, y + 8, 3, 'rgba(255,255,255,0.7)');
  }
  // Bunting flags (one flag is a difference).
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 52;
    const y = 196 + Math.sin(i * 0.7) * 6;
    const c = ['#ef476f', '#ffd166', '#06d6a0'][i % 3];
    poly(ctx, [[x, y], [x + 26, y], [x + 13, y + 26]], i === 8 ? '#ef476f' : c);
  }
  // Ground.
  rect(ctx, 0, 380, PANEL_W, 180, '#3a2b3f');
  for (let i = 0; i < 26; i++) {
    const x = (i * 67) % 540;
    const y = 396 + ((i * 37) % 150);
    ellipse(ctx, x, y, 16, 7, 'rgba(255,255,255,0.05)');
  }
  // Left stall: red-striped awning, counter, jars.
  for (let i = 0; i < 5; i++) rect(ctx, 60 + i * 40, 220, 20, 42, i % 2 ? '#f4ead8' : '#d94f3d');
  poly(ctx, [[52, 220], [268, 220], [260, 262], [60, 262]], '#d94f3d');
  rect(ctx, 60, 340, 200, 84, '#6b4a2f');
  rect(ctx, 60, 340, 200, 10, '#8a6d3b');
  for (const [x, c] of [[90, '#e8b4b8'], [130, '#a8d5a2'], [170, '#f7d774'], [210, '#9bb8e8']]) {
    rect(ctx, x, 306, 24, 34, c);
    rect(ctx, x + 4, 298, 16, 8, '#5b4636');
  }
  // Stall sign (difference: TEH vs KOPI).
  rect(ctx, 120, 284, 80, 34, '#f4ead8');
  rect(ctx, 120, 284, 80, 34, 'rgba(0,0,0,0)');
  ctx.strokeStyle = '#5b4636';
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 284, 80, 34);
  text(ctx, 'TEH', 160, 302, 20, '#5b4636');
  // Right stall: teal awning, fruit baskets.
  for (let i = 0; i < 5; i++) rect(ctx, 320 + i * 40, 220, 20, 42, i % 2 ? '#f4ead8' : '#2a9d8f');
  poly(ctx, [[312, 220], [528, 220], [520, 262], [320, 262]], '#2a9d8f');
  rect(ctx, 320, 340, 200, 84, '#6b4a2f');
  rect(ctx, 320, 340, 200, 10, '#8a6d3b');
  for (const x of [350, 400, 450]) {
    ellipse(ctx, x, 330, 26, 12, '#b08968');
    for (const [dx, dy] of [[-10, -6], [0, -10], [10, -6]]) circle(ctx, x + dx, 330 + dy, 8, '#ff8c42');
  }
  // Hanging lanterns (the middle one is a difference).
  paperLantern(ctx, 60, 190, '#e74c3c');
  paperLantern(ctx, 118, 190, '#e74c3c');
  paperLantern(ctx, 300, 190, '#f7c948');
  // Crates and a sitting cat (the tail is a difference).
  rect(ctx, 380, 460, 60, 60, '#8a6d3b');
  rect(ctx, 380, 460, 60, 8, '#a5855c');
  strokeLine(ctx, 380, 490, 440, 490, '#6b4a2f', 3);
  ellipse(ctx, 435, 480, 22, 28, '#2c2430'); // cat body
  circle(ctx, 435, 444, 15, '#2c2430'); // cat head
  poly(ctx, [[424, 434], [430, 420], [436, 433]], '#2c2430');
  poly(ctx, [[436, 433], [442, 420], [448, 434]], '#2c2430');
  curve(ctx, [[452, 472], [472, 462], [470, 440]], '#2c2430', 6); // tail up
  circle(ctx, 430, 442, 2, '#ffd166');
  circle(ctx, 440, 442, 2, '#ffd166');
}

const MARKET_DIFFERENCES = [
  {
    id: 'moon', x: 472, y: 82, r: 26, label: 'the moon',
    drawRight(ctx) { circle(ctx, 472, 82, 24, '#ffe9a8'); },
  },
  {
    id: 'lantern', x: 118, y: 190, r: 22, label: 'the middle lantern',
    drawRight(ctx) { paperLantern(ctx, 118, 190, '#f7c948'); },
  },
  {
    id: 'tail', x: 458, y: 455, r: 24, label: 'the cat\u2019s tail',
    drawRight(ctx) {
      ellipse(ctx, 462, 448, 13, 19, '#3a2b3f');
      curve(ctx, [[450, 486], [468, 496], [478, 508]], '#2c2430', 6); // tail down
    },
  },
  {
    id: 'sign', x: 160, y: 302, r: 30, label: 'the stall sign',
    drawRight(ctx) {
      rect(ctx, 120, 284, 80, 34, '#f4ead8');
      ctx.strokeStyle = '#5b4636';
      ctx.lineWidth = 3;
      ctx.strokeRect(120, 284, 80, 34);
      text(ctx, 'KOPI', 160, 302, 20, '#5b4636');
    },
  },
  {
    id: 'star', x: 300, y: 64, r: 12, label: 'a star',
    drawRight(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 380);
      g.addColorStop(0, '#1b2350');
      g.addColorStop(0.55, '#5b3a7d');
      g.addColorStop(1, '#e08a5a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(300, 64, 13, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'fish', x: 285, y: 425, r: 22, label: 'a fish on the ground',
    drawRight(ctx) {
      ellipse(ctx, 285, 425, 18, 8, '#cfe3ea');
      poly(ctx, [[302, 425], [314, 417], [314, 433]], '#cfe3ea');
      circle(ctx, 274, 423, 2, '#2c2430');
    },
  },
  {
    id: 'flag', x: 489, y: 202, r: 18, label: 'the last flag',
    drawRight(ctx) { poly(ctx, [[476, 192], [502, 192], [489, 218]], '#06d6a0'); },
  },
];

// ===================================================================
// Scene 2 — Garden at Dusk. 9 differences, 150 seconds, 2 hints.
// ===================================================================
function drawGardenBase(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 400);
  g.addColorStop(0, '#123a4a');
  g.addColorStop(0.6, '#4a6b8a');
  g.addColorStop(1, '#e8a87c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL_W, 400);
  // Low sun and a few early stars.
  circle(ctx, 480, 90, 30, '#ffd166');
  for (const [x, y, r] of [[70, 60, 2], [180, 44, 3], [300, 80, 2], [380, 50, 2]]) sparkle(ctx, x, y, r, '#fff8c9');
  // Big tree on the left.
  rect(ctx, 78, 180, 26, 200, '#5b4636');
  curve(ctx, [[91, 200], [60, 160], [40, 120]], '#5b4636', 12);
  curve(ctx, [[91, 220], [130, 180], [150, 140]], '#5b4636', 10);
  circle(ctx, 60, 110, 46, '#2e6b34');
  circle(ctx, 120, 96, 54, '#357a3a');
  circle(ctx, 150, 150, 40, '#2e6b34');
  circle(ctx, 40, 160, 34, '#357a3a');
  // A branch that is a difference: extra branch on the right panel.
  // (Drawn only by the difference; the base has just the two branches above.)
  // Butterfly (difference: absent on the right).
  ellipse(ctx, 250, 150, 10, 14, '#ef476f');
  ellipse(ctx, 250, 150, 10, 14, 'rgba(239,71,111,0.55)');
  poly(ctx, [[250, 138], [238, 128], [242, 142]], '#ffd166');
  poly(ctx, [[250, 138], [262, 128], [258, 142]], '#ffd166');
  poly(ctx, [[250, 162], [238, 172], [242, 158]], '#ffd166');
  poly(ctx, [[250, 162], [262, 172], [258, 158]], '#ffd166');
  // Fireflies.
  for (const [x, y] of [[330, 120], [200, 90], [420, 180], [280, 200], [480, 220]]) {
    circle(ctx, x, y, 4, '#ffe66d');
    circle(ctx, x, y, 8, 'rgba(255,230,109,0.25)');
  }
  // Lawn.
  rect(ctx, 0, 400, PANEL_W, 160, '#3d7a44');
  for (let i = 0; i < 30; i++) {
    const x = (i * 53) % 540;
    const y = 410 + ((i * 29) % 140);
    strokeLine(ctx, x, y, x + 3, y - 10, '#2e6b34', 2);
  }
  // Flower bed along the bottom-left (one flower is a difference).
  drawFlower(ctx, 80, 300, '#ef476f');
  drawFlower(ctx, 118, 300, '#ef476f');
  drawFlower(ctx, 140, 310, '#ffd166');
  drawFlower(ctx, 180, 296, '#ef476f');
  drawFlower(ctx, 220, 308, '#9b5de5');
  // Bench (a slat is a difference).
  rect(ctx, 170, 360, 130, 12, '#8a6d3b');
  rect(ctx, 170, 384, 130, 12, '#8a6d3b');
  rect(ctx, 170, 408, 130, 12, '#8a6d3b');
  rect(ctx, 180, 372, 10, 60, '#6b4a2f');
  rect(ctx, 280, 372, 10, 60, '#6b4a2f');
  rect(ctx, 176, 420, 12, 30, '#6b4a2f');
  rect(ctx, 282, 420, 12, 30, '#6b4a2f');
  // Watering can by the bench.
  rect(ctx, 320, 420, 44, 30, '#7a9e7e');
  poly(ctx, [[364, 428], [392, 414], [392, 424], [364, 438]], '#7a9e7e');
  curve(ctx, [[320, 428], [306, 428], [306, 444]], '#5b7a5e', 5);
  // Pond bottom-right with a lily pad and a frog (an eye is a difference).
  ellipse(ctx, 440, 500, 110, 52, '#2a6b8a');
  ellipse(ctx, 440, 500, 96, 42, '#3a8ab0');
  ellipse(ctx, 392, 428, 34, 12, '#2e6b34'); // lily pad
  circle(ctx, 384, 420, 10, '#57cc5e'); // frog head left bump
  circle(ctx, 400, 420, 10, '#57cc5e'); // frog head right bump
  ellipse(ctx, 392, 436, 22, 12, '#57cc5e'); // frog body
  circle(ctx, 384, 418, 4, '#ffffff');
  circle(ctx, 400, 418, 4, '#ffffff');
  circle(ctx, 384, 418, 2, '#1a1a1a');
  circle(ctx, 400, 418, 2, '#1a1a1a');
  // Snail on the lawn (antennae are a difference).
  ellipse(ctx, 468, 498, 20, 13, '#b08968');
  circle(ctx, 468, 490, 12, '#d9a05b');
  circle(ctx, 462, 478, 2, '#1a1a1a');
  circle(ctx, 474, 478, 2, '#1a1a1a');
  strokeLine(ctx, 462, 480, 458, 470, '#d9a05b', 2);
  strokeLine(ctx, 474, 480, 478, 470, '#d9a05b', 2);
  // Mushroom patch (a mushroom is a difference: absent on the left).
  ellipse(ctx, 60, 520, 16, 10, '#e8e0d0');
  poly(ctx, [[44, 520], [76, 520], [60, 496]], '#e74c3c');
  circle(ctx, 54, 508, 3, '#ffffff');
  circle(ctx, 66, 512, 2, '#ffffff');
}

function drawFlower(ctx, x, y, color) {
  strokeLine(ctx, x, y, x, y + 22, '#2e6b34', 3);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    circle(ctx, x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6, color);
  }
  circle(ctx, x, y, 6, '#ffd166');
}

const GARDEN_DIFFERENCES = [
  {
    id: 'wink', x: 400, y: 418, r: 20, label: 'the frog\u2019s eye',
    drawRight(ctx) {
      circle(ctx, 400, 420, 10, '#57cc5e');
      strokeLine(ctx, 394, 418, 406, 418, '#1a1a1a', 3);
    },
  },
  {
    id: 'flower', x: 118, y: 300, r: 18, label: 'a flower\u2019s colour',
    drawRight(ctx) { drawFlower(ctx, 118, 300, '#ff8c42'); },
  },
  {
    id: 'butterfly', x: 250, y: 150, r: 18, label: 'the butterfly',
    drawRight(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 400);
      g.addColorStop(0, '#123a4a');
      g.addColorStop(0.6, '#4a6b8a');
      g.addColorStop(1, '#e8a87c');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(250, 150, 22, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'mushroom', x: 500, y: 480, r: 20, label: 'a second mushroom',
    drawRight(ctx) {
      ellipse(ctx, 500, 512, 14, 9, '#e8e0d0');
      poly(ctx, [[486, 512], [514, 512], [500, 490]], '#e74c3c');
      circle(ctx, 494, 502, 3, '#ffffff');
      circle(ctx, 506, 506, 2, '#ffffff');
    },
  },
  {
    id: 'slat', x: 235, y: 384, r: 22, label: 'a bench slat',
    drawRight(ctx) {
      // The middle slat sits against the sky, so repaint it with the sky
      // gradient, then restore the two leg segments the repaint crosses.
      const g = ctx.createLinearGradient(0, 0, 0, 400);
      g.addColorStop(0, '#123a4a');
      g.addColorStop(0.6, '#4a6b8a');
      g.addColorStop(1, '#e8a87c');
      ctx.fillStyle = g;
      ctx.fillRect(170, 384, 130, 12);
      rect(ctx, 180, 384, 10, 12, '#6b4a2f');
      rect(ctx, 280, 384, 10, 12, '#6b4a2f');
    },
  },
  {
    id: 'firefly', x: 330, y: 120, r: 10, label: 'a firefly',
    drawRight(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 400);
      g.addColorStop(0, '#123a4a');
      g.addColorStop(0.6, '#4a6b8a');
      g.addColorStop(1, '#e8a87c');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(330, 120, 12, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'branch', x: 92, y: 122, r: 24, label: 'a tree branch',
    drawRight(ctx) { curve(ctx, [[91, 160], [70, 130], [44, 108]], '#5b4636', 9); },
  },
  {
    id: 'antenna', x: 468, y: 476, r: 18, label: 'the snail\u2019s antenna',
    drawRight(ctx) {
      // Erase the right antenna and its eye, then repaint the snail's head
      // and the remaining left antenna over the patch.
      rect(ctx, 470, 466, 12, 16, '#3d7a44');
      circle(ctx, 468, 490, 12, '#d9a05b');
      circle(ctx, 462, 478, 2, '#1a1a1a');
      strokeLine(ctx, 462, 480, 458, 470, '#d9a05b', 2);
    },
  },
  {
    id: 'ripples', x: 430, y: 520, r: 22, label: 'ripples on the pond',
    drawRight(ctx) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(430, 520, 20, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(430, 520, 12, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
];

// ===================================================================
// Scene 3 — Harbor Morning. 12 differences, 180 seconds, 3 hints.
// ===================================================================
function harborSky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 330);
  g.addColorStop(0, '#aee2ff');
  g.addColorStop(1, '#fdf3d0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL_W, 330);
}

function drawHarborBase(ctx) {
  harborSky(ctx);
  // Sun without rays (difference: rays on the right).
  circle(ctx, 90, 80, 28, '#ffd166');
  circle(ctx, 90, 80, 20, '#ffe9a8');
  // Clouds (one is a difference).
  ellipse(ctx, 200, 200, 40, 16, '#ffffff');
  ellipse(ctx, 226, 192, 30, 14, '#ffffff');
  ellipse(ctx, 420, 90, 36, 14, '#ffffff');
  ellipse(ctx, 442, 82, 26, 12, '#ffffff');
  // Gulls (one is a difference: three on the left, two on the right).
  drawGull(ctx, 230, 140);
  drawGull(ctx, 262, 128);
  drawGull(ctx, 292, 146);
  // Sea.
  rect(ctx, 0, 330, PANEL_W, 230, '#2a7fa8');
  rect(ctx, 0, 330, PANEL_W, 10, '#57b8d9');
  for (let i = 0; i < 12; i++) {
    const x = (i * 89) % 520;
    const y = 360 + ((i * 53) % 170);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Lighthouse on the right (beam and flag are differences).
  rect(ctx, 448, 150, 44, 320, '#f4ead8');
  for (let i = 0; i < 5; i++) rect(ctx, 448, 190 + i * 60, 44, 26, '#d94f3d');
  rect(ctx, 440, 130, 60, 22, '#2c2430');
  circle(ctx, 470, 122, 14, '#ffd166');
  poly(ctx, [[448, 150], [492, 150], [470, 128]], '#2c2430');
  // Pier along the bottom.
  rect(ctx, 0, 470, PANEL_W, 90, '#8a6d3b');
  rect(ctx, 0, 470, PANEL_W, 8, '#a5855c');
  for (const x of [60, 160, 260, 360, 460]) rect(ctx, x, 478, 12, 82, '#6b4a2f');
  // Sailboat with a striped sail (the stripe is a difference).
  poly(ctx, [[150, 320], [150, 200], [215, 320]], '#ffffff');
  poly(ctx, [[150, 320], [150, 230], [205, 320]], '#ef476f');
  rect(ctx, 130, 320, 110, 18, '#8a6d3b');
  rect(ctx, 146, 292, 8, 28, '#5b4636');
  // Second boat, smaller, on the right.
  poly(ctx, [[330, 340], [330, 260], [380, 340]], '#fff3d6');
  rect(ctx, 315, 340, 80, 14, '#6b4a2f');
  // Buoy (difference: red vs yellow).
  ellipse(ctx, 520, 470, 14, 18, '#d94f3d');
  rect(ctx, 514, 446, 12, 10, '#8a6d3b');
  // Rope coil on the pier (difference: coil vs straight rope).
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 5;
  for (const r of [16, 11, 6]) {
    ctx.beginPath();
    ctx.ellipse(280, 520, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Harbor house window (difference: lit vs dark).
  rect(ctx, 180, 180, 44, 40, '#f4ead8');
  poly(ctx, [[174, 180], [230, 180], [202, 158]], '#d94f3d');
  rect(ctx, 192, 192, 20, 20, '#ffd166');
  // Anchor leaning on the pier (difference: absent on the right).
  strokeLine(ctx, 350, 470, 350, 510, '#2c2430', 5);
  circle(ctx, 350, 474, 7, '#2c2430');
  curve(ctx, [[350, 510], [332, 512], [330, 496]], '#2c2430', 5);
  curve(ctx, [[350, 510], [368, 512], [370, 496]], '#2c2430', 5);
  // A fish jumping near the second boat (difference: absent on the right).
  ellipse(ctx, 430, 380, 14, 7, '#cfe3ea');
  poly(ctx, [[442, 380], [454, 373], [454, 387]], '#cfe3ea');
  // Crates stacked on the left of the pier (a crate is a difference: absent).
  rect(ctx, 90, 440, 40, 30, '#a5855c');
  rect(ctx, 100, 412, 34, 28, '#8a6d3b');
}

function drawGull(ctx, x, y) {
  ctx.strokeStyle = '#2c2430';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.quadraticCurveTo(x - 4, y - 7, x, y);
  ctx.quadraticCurveTo(x + 4, y - 7, x + 10, y);
  ctx.stroke();
}

const HARBOR_DIFFERENCES = [
  {
    id: 'rays', x: 90, y: 80, r: 24, label: 'the sun\u2019s rays',
    drawRight(ctx) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        strokeLine(ctx, 90 + Math.cos(a) * 34, 80 + Math.sin(a) * 34,
          90 + Math.cos(a) * 46, 80 + Math.sin(a) * 46, '#ffd166', 4);
      }
    },
  },
  {
    id: 'cloud', x: 300, y: 70, r: 26, label: 'a cloud',
    drawRight(ctx) {
      ellipse(ctx, 300, 70, 40, 16, '#ffffff');
      ellipse(ctx, 326, 62, 30, 14, '#ffffff');
    },
  },
  {
    id: 'beam', x: 470, y: 122, r: 18, label: 'the lighthouse beam',
    drawRight(ctx) {
      ctx.fillStyle = 'rgba(255,233,168,0.55)';
      poly(ctx, [[470, 122], [380, 96], [380, 148]]);
    },
  },
  {
    id: 'stripe', x: 180, y: 300, r: 24, label: 'the sail\u2019s stripe',
    drawRight(ctx) { poly(ctx, [[150, 320], [150, 230], [205, 320]], '#2a7fa8'); },
  },
  {
    id: 'gull', x: 292, y: 146, r: 16, label: 'a gull',
    drawRight(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 330);
      g.addColorStop(0, '#aee2ff');
      g.addColorStop(1, '#fdf3d0');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(292, 146, 14, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'buoy', x: 520, y: 470, r: 18, label: 'the buoy',
    drawRight(ctx) {
      ellipse(ctx, 520, 470, 14, 18, '#f7c948');
      rect(ctx, 514, 446, 12, 10, '#8a6d3b');
    },
  },
  {
    id: 'crate', x: 160, y: 455, r: 20, label: 'a crate on the pier',
    drawRight(ctx) {
      rect(ctx, 140, 440, 40, 30, '#a5855c');
      rect(ctx, 140, 440, 40, 8, '#c2a878');
      strokeLine(ctx, 140, 455, 180, 455, '#8a6d3b', 3);
    },
  },
  {
    id: 'anchor', x: 350, y: 492, r: 20, label: 'the anchor',
    drawRight(ctx) {
      // Erase the anchor, then restore the pier strip and plank the patch crosses.
      rect(ctx, 322, 462, 56, 56, '#8a6d3b');
      rect(ctx, 322, 470, 56, 8, '#a5855c');
      rect(ctx, 360, 478, 12, 40, '#6b4a2f');
    },
  },
  {
    id: 'fish', x: 430, y: 380, r: 18, label: 'the jumping fish',
    drawRight(ctx) {
      ctx.fillStyle = '#2a7fa8';
      ctx.beginPath();
      ctx.ellipse(430, 380, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'flag', x: 497, y: 74, r: 16, label: 'the lighthouse flag',
    drawRight(ctx) {
      strokeLine(ctx, 484, 136, 484, 66, '#2c2430', 3);
      poly(ctx, [[484, 66], [510, 74], [484, 82]], '#ef476f');
    },
  },
  {
    id: 'coil', x: 280, y: 520, r: 18, label: 'the rope coil',
    drawRight(ctx) {
      ctx.fillStyle = '#8a6d3b';
      ctx.fillRect(250, 508, 60, 24);
      rect(ctx, 260, 508, 12, 24, '#6b4a2f');
      strokeLine(ctx, 250, 520, 310, 520, '#e8dcc0', 5);
    },
  },
  {
    id: 'window', x: 202, y: 202, r: 16, label: 'the house window',
    drawRight(ctx) { rect(ctx, 192, 192, 20, 20, '#2c2430'); },
  },
];

// The three levels, in play order. timeLimit is seconds, hints are uses per level.
export const SCENES = [
  {
    id: 'market', title: 'Night Market', timeLimit: 120, hints: 2,
    drawBase: drawMarketBase, differences: MARKET_DIFFERENCES,
  },
  {
    id: 'garden', title: 'Garden at Dusk', timeLimit: 150, hints: 2,
    drawBase: drawGardenBase, differences: GARDEN_DIFFERENCES,
  },
  {
    id: 'harbor', title: 'Harbor Morning', timeLimit: 180, hints: 3,
    drawBase: drawHarborBase, differences: HARBOR_DIFFERENCES,
  },
];
