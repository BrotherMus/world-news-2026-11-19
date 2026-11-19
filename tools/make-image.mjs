// Draws the entry: one 1024 x 1024 picture of the world's news of Thursday 19 November 2026.
//
//   node tools/make-image.mjs            writes build/entry.html (the picture as one inline SVG)
//   node tools/make-image.mjs --render   also renders it to entry.png with a local headless browser
//
// Everything in the picture is drawn here as vector shapes; no outside artwork is used.
// The stories are data (STORIES below), so the wording can follow the day as it unfolds.

import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SIZE = 1024;

// ---------------------------------------------------------------------------------------------
// The day
// ---------------------------------------------------------------------------------------------

const DAY = 'THURSDAY 19 NOVEMBER 2026';

// Each story: where it sits, its place and field, a two-line headline and the drawing that shows it.
const STORIES = [
  {
    art: 'summit', lead: true, accent: '#b3261e',
    tag: 'SHENZHEN, CHINA · APEC SUMMIT',
    lines: ['TRUMP, XI AND PUTIN MEET', 'FOR FIRST THREE-WAY SUMMIT'],
  },
  {
    art: 'missiles', accent: '#c2410c',
    tag: 'RIYADH · IRAN WAR',
    lines: ['MISSILES TARGET RIYADH', 'AS IRAN WAR WIDENS'],
  },
  {
    art: 'climate', accent: '#0f766e',
    tag: 'ANTALYA · CLIMATE',
    lines: ['COP31 TALKS DEADLOCKED', 'A DAY BEFORE CLOSE'],
  },
  {
    art: 'court', accent: '#5b3fa8',
    tag: 'THE HAGUE · JUSTICE',
    lines: ['ROHINGYA GENOCIDE CASE:', 'WORLD COURT VERDICT DAY'],
  },
  {
    art: 'market', accent: '#0b6bcb',
    tag: 'NEW YORK · MARKETS',
    lines: ["ANTHROPIC'S NASDAQ DEBUT", 'AFTER $83-A-SHARE IPO'],
  },
  {
    art: 'cyclone', accent: '#1d6f94',
    tag: 'INDIA · WEATHER',
    lines: ['CYCLONE AKVAN NEARS:', '50,000 EVACUATED'],
  },
  {
    art: 'pact', accent: '#9a6700',
    tag: 'CARACAS · DEFENCE',
    lines: ['US AND VENEZUELA', 'SIGN MILITARY PACT'],
  },
  {
    art: 'game', accent: '#c2255c',
    tag: 'WORLDWIDE · GAMING',
    lines: ['GRAND THEFT AUTO VI', 'GOES ON SALE'],
  },
];

// ---------------------------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------------------------

const n = (v) => Number(v.toFixed(1));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const HEAD_FONT = "font-family=\"Bahnschrift, 'Arial Narrow', Arial, sans-serif\" font-stretch=\"75%\" font-weight=\"700\"";

// A star or burst: `points` tips, outer radius r1, inner radius r2.
function burst(cx, cy, r1, r2, points, fill, extra = '') {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? r1 : r2;
    pts.push(`${n(cx + r * Math.cos(a))},${n(cy + r * Math.sin(a))}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${extra}/>`;
}
const star = (cx, cy, r, fill) => burst(cx, cy, r, r * 0.4, 5, fill);

function flagFrame(x, y, w, h, inner) {
  return `<g>${inner}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#00000055" stroke-width="1"/></g>`;
}

function flagUS(x, y, w, h) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>`;
  const stripe = h / 7;
  for (let i = 0; i < 7; i += 2) s += `<rect x="${x}" y="${n(y + i * stripe)}" width="${w}" height="${n(stripe)}" fill="#c8102e"/>`;
  const cw = w * 0.46, ch = stripe * 4;
  s += `<rect x="${x}" y="${y}" width="${n(cw)}" height="${n(ch)}" fill="#1f3a8a"/>`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    s += `<circle cx="${n(x + cw * (0.14 + c * 0.24))}" cy="${n(y + ch * (0.2 + r * 0.3))}" r="${n(h * 0.035)}" fill="#ffffff"/>`;
  }
  return flagFrame(x, y, w, h, s);
}

function flagChina(x, y, w, h) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#de2910"/>`;
  s += star(x + w * 0.2, y + h * 0.3, h * 0.2, '#ffde00');
  for (const [dx, dy] of [[0.38, 0.12], [0.46, 0.26], [0.46, 0.44], [0.38, 0.58]]) s += star(x + w * dx, y + h * dy, h * 0.07, '#ffde00');
  return flagFrame(x, y, w, h, s);
}

function flagRussia(x, y, w, h) {
  const b = h / 3;
  const s = `<rect x="${x}" y="${y}" width="${w}" height="${n(b)}" fill="#ffffff"/>`
    + `<rect x="${x}" y="${n(y + b)}" width="${w}" height="${n(b)}" fill="#0039a6"/>`
    + `<rect x="${x}" y="${n(y + 2 * b)}" width="${w}" height="${n(b)}" fill="#d52b1e"/>`;
  return flagFrame(x, y, w, h, s);
}

function flagVenezuela(x, y, w, h) {
  const b = h / 3;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${n(b)}" fill="#ffcc00"/>`
    + `<rect x="${x}" y="${n(y + b)}" width="${w}" height="${n(b)}" fill="#00247d"/>`
    + `<rect x="${x}" y="${n(y + 2 * b)}" width="${w}" height="${n(b)}" fill="#cf142b"/>`;
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (1.15 + (i * 0.7) / 7);
    s += `<circle cx="${n(x + w / 2 + w * 0.2 * Math.cos(a))}" cy="${n(y + h * 0.66 + h * 0.22 * Math.sin(a))}" r="${n(h * 0.035)}" fill="#ffffff"/>`;
  }
  return flagFrame(x, y, w, h, s);
}

// A flag flying from a pole whose foot is at (x, footY).
function flagOnPole(flag, x, topY, footY, w, h) {
  return `<rect x="${x - 2}" y="${topY - 5}" width="4" height="${footY - topY + 5}" fill="#d9d9d9"/>`
    + `<circle cx="${x}" cy="${topY - 6}" r="4" fill="#f2c14e"/>` + flag(x + 2, topY, w, h);
}

// A plain figure in a suit, seen from the front: no likeness, the flag beside it says who it stands for.
function delegate(cx, baseY, { skin, hair, suit, tie }) {
  const headY = baseY - 62;
  return `<g>`
    + `<path d="M ${cx - 36},${baseY} Q ${cx - 36},${baseY - 40} ${cx - 13},${baseY - 45} L ${cx + 13},${baseY - 45} Q ${cx + 36},${baseY - 40} ${cx + 36},${baseY} Z" fill="${suit}"/>`
    + `<polygon points="${cx - 9},${baseY - 45} ${cx + 9},${baseY - 45} ${cx},${baseY - 27}" fill="#ffffff"/>`
    + `<polygon points="${cx - 3},${baseY - 42} ${cx + 3},${baseY - 42} ${cx + 4},${baseY - 14} ${cx},${baseY - 7} ${cx - 4},${baseY - 14}" fill="${tie}"/>`
    + `<rect x="${cx - 5}" y="${headY + 10}" width="10" height="9" fill="${skin}"/>`
    + `<circle cx="${cx}" cy="${headY - 3}" r="15.5" fill="${hair}"/>`
    + `<circle cx="${cx}" cy="${headY + 1}" r="14" fill="${skin}"/>`
    + `</g>`;
}

// A row of buildings standing on baseY: each entry is [x, width, height].
function skyline(blocks, baseY, fill, opacity = 1) {
  return `<g fill="${fill}" opacity="${opacity}">` + blocks.map(([x, w, h]) => `<rect x="${x}" y="${baseY - h}" width="${w}" height="${h}"/>`).join('') + `</g>`;
}

function palm(x, baseY, height, lean, color) {
  const tx = x + lean, ty = baseY - height;
  let s = `<path d="M ${x},${baseY} Q ${x + lean * 0.2},${baseY - height * 0.6} ${tx},${ty}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
  for (const [dx, dy] of [[-34, -6], [-28, 14], [-16, -24], [34, -6], [28, 14], [16, -24], [0, -30]]) {
    s += `<path d="M ${tx},${ty} Q ${n(tx + dx * 0.55)},${n(ty + dy - 12)} ${tx + dx},${ty + dy + 8}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
  }
  return s;
}

function gradient(id, stops, vertical = true) {
  const dir = vertical ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"';
  return `<linearGradient id="${id}" ${dir}>` + stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + `</linearGradient>`;
}

// ---------------------------------------------------------------------------------------------
// The eight drawings. Each fills a w x h box whose top-left corner is (0, 0).
// ---------------------------------------------------------------------------------------------

const ART = {
  // Three leaders at one table under their flags, Shenzhen's towers behind them.
  summit(w, h) {
    const people = [
      { cx: 190, flag: flagUS, plate: 'USA', look: { skin: '#f0c9a4', hair: '#e8d9a8', suit: '#1b2a4a', tie: '#c8102e' } },
      { cx: 352, flag: flagChina, plate: 'CHINA', look: { skin: '#eac39b', hair: '#1c1c1c', suit: '#20242c', tie: '#8f1d1d' } },
      { cx: 514, flag: flagRussia, plate: 'RUSSIA', look: { skin: '#f1cfb0', hair: '#c9c2b4', suit: '#262b38', tie: '#1f3a8a' } },
    ];
    let s = `<defs>${gradient('g-summit', [[0, '#0f3460'], [1, '#4f9fd6']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-summit)"/>`;
    s += skyline([[0, 34, 52], [38, 26, 78], [70, 40, 44], [118, 22, 66], [250, 30, 58], [286, 20, 84], [420, 34, 50], [458, 24, 72], [560, 36, 96], [600, 26, 60], [630, 40, 80]], h, '#0a2748', 0.6);
    s += `<polygon points="574,54 578,10 582,54" fill="#0a2748" opacity="0.6"/>`;
    for (const p of people) s += flagOnPole(p.flag, p.cx - 88, 20, h, 62, 41);
    for (const p of people) s += delegate(p.cx, 124, p.look);
    s += `<rect x="34" y="118" width="${w - 68}" height="${h - 118}" rx="4" fill="#7a4a21"/>`;
    s += `<rect x="34" y="118" width="${w - 68}" height="5" rx="2" fill="#a86a34"/>`;
    for (const p of people) {
      s += `<rect x="${p.cx - 36}" y="127" width="72" height="20" rx="3" fill="#ffffff"/>`;
      s += `<text x="${p.cx}" y="142.5" text-anchor="middle" ${HEAD_FONT} font-size="16" fill="#111827">${p.plate}</text>`;
    }
    return s;
  },

  // Missiles over a night skyline, one met by an interceptor.
  missiles(w, h) {
    let s = `<defs>${gradient('g-missiles', [[0, '#141a3a'], [0.6, '#4a2a4f'], [1, '#d0602c']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-missiles)"/>`;
    for (const [x, y] of [[30, 40], [96, 22], [210, 16], [292, 36], [262, 14], [140, 46]]) s += `<circle cx="${x}" cy="${y}" r="1.6" fill="#ffffff" opacity="0.8"/>`;
    s += skyline([[0, 30, 40], [34, 22, 58], [60, 36, 34], [100, 24, 50], [128, 40, 30], [172, 20, 44], [236, 30, 52], [270, 24, 36], [298, 28, 60]], h, '#0d0f1f');
    s += `<path d="M 196,${h} L 196,64 Q 199,42 207,36 Q 212,72 217,36 Q 225,42 228,64 L 228,${h} Z" fill="#0d0f1f"/>`;
    s += `<path d="M 8,14 Q 96,12 150,62" fill="none" stroke="#ffd9a0" stroke-width="4" stroke-dasharray="10 6" stroke-linecap="round"/>`;
    s += `<path d="M 300,${h - 30} Q 250,84 160,66" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.9"/>`;
    s += burst(154, 64, 26, 10, 10, '#ffb703') + burst(154, 64, 14, 6, 10, '#fff3b0');
    s += `<path d="M 120,2 Q 220,20 276,84" fill="none" stroke="#ffd9a0" stroke-width="4" stroke-dasharray="10 6" stroke-linecap="round"/>`;
    s += `<polygon points="286,96 270,86 280,78" fill="#ff7b39"/>`;
    return s;
  },

  // A warming globe, a thermometer, and two arrows that meet head-on: talks stuck.
  climate(w, h) {
    let s = `<defs>${gradient('g-climate', [[0, '#0e7a66'], [1, '#0a4f5e']])}<clipPath id="c-globe"><circle cx="72" cy="76" r="52"/></clipPath></defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-climate)"/>`;
    s += `<circle cx="72" cy="76" r="52" fill="#2f8fd0"/>`;
    s += `<g clip-path="url(#c-globe)" fill="#58b368">`
      + `<path d="M 28,40 Q 52,28 70,42 Q 78,58 60,66 Q 50,84 36,76 Q 20,62 28,40 Z"/>`
      + `<path d="M 84,58 Q 108,50 122,66 Q 126,92 108,104 Q 92,112 88,92 Q 78,74 84,58 Z"/>`
      + `<path d="M 40,96 Q 58,90 66,106 Q 62,126 46,130 Q 34,116 40,96 Z"/></g>`;
    s += `<circle cx="72" cy="76" r="52" fill="none" stroke="#ffffff" stroke-width="3"/>`;
    s += `<rect x="143" y="18" width="18" height="96" rx="9" fill="#ffffff"/>`;
    s += `<circle cx="152" cy="118" r="17" fill="#ffffff"/><circle cx="152" cy="118" r="12" fill="#e5383b"/>`;
    s += `<rect x="148" y="46" width="8" height="70" rx="4" fill="#e5383b"/>`;
    s += `<text x="248" y="70" text-anchor="middle" ${HEAD_FONT} font-size="54" fill="#ffffff">COP31</text>`;
    const arrow = (x1, x2, dir) => `<path d="M ${x1},108 L ${x2},108" stroke="#ffd166" stroke-width="9" stroke-linecap="round"/>`
      + `<polygon points="${x2 + dir * 16},108 ${x2 - dir * 2},94 ${x2 - dir * 2},122" fill="#ffd166"/>`;
    s += arrow(186, 224, 1) + arrow(310, 272, -1);
    return s;
  },

  // The scales of justice in front of the court's palace.
  court(w, h) {
    let s = `<defs>${gradient('g-court', [[0, '#2a2550'], [1, '#55469c']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-court)"/>`;
    const stone = '#3d3672';
    s += `<rect x="26" y="108" width="274" height="${h - 108}" fill="${stone}"/>`;
    s += `<polygon points="20,108 163,84 306,108" fill="${stone}"/>`;
    s += `<rect x="52" y="44" width="30" height="70" fill="${stone}"/><polygon points="48,44 67,8 86,44" fill="${stone}"/>`;
    s += `<rect x="252" y="76" width="20" height="36" fill="${stone}"/><polygon points="249,76 262,52 275,76" fill="${stone}"/>`;
    for (let x = 40; x < 290; x += 22) s += `<rect x="${x}" y="122" width="10" height="${h - 122}" rx="5" fill="#2a2550"/>`;
    const gold = '#f2c14e';
    s += `<rect x="159" y="26" width="8" height="106" fill="${gold}"/><circle cx="163" cy="24" r="8" fill="${gold}"/>`;
    s += `<rect x="128" y="130" width="70" height="10" rx="5" fill="${gold}"/>`;
    s += `<rect x="86" y="40" width="154" height="7" rx="3.5" fill="${gold}"/>`;
    for (const cx of [92, 234]) {
      s += `<path d="M ${cx},46 L ${cx - 30},94 M ${cx},46 L ${cx + 30},94" stroke="${gold}" stroke-width="2.5" fill="none"/>`;
      s += `<path d="M ${cx - 36},94 L ${cx + 36},94 Q ${cx},124 ${cx - 36},94 Z" fill="${gold}"/>`;
    }
    return s;
  },

  // The opening bell and the ticker tape on the day of a stock market debut.
  market(w, h) {
    let s = `<defs>${gradient('g-market', [[0, '#081a33'], [1, '#0d3b66']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-market)"/>`;
    for (let x = 20; x < w; x += 44) s += `<rect x="${x}" y="0" width="1" height="${h}" fill="#ffffff" opacity="0.08"/>`;
    for (let y = 22; y < h; y += 32) s += `<rect x="0" y="${y}" width="${w}" height="1" fill="#ffffff" opacity="0.08"/>`;
    for (const [x, y, bh] of [[26, 70, 34], [54, 60, 30], [82, 66, 40], [110, 52, 36]]) {
      s += `<rect x="${x + 6}" y="${y - 10}" width="2" height="${bh + 20}" fill="#8fd3ff"/><rect x="${x}" y="${y}" width="14" height="${bh}" fill="#8fd3ff"/>`;
    }
    const bx = 226, by = 60;
    s += `<path d="M ${bx - 46},${by + 26} Q ${bx - 30},${by + 14} ${bx - 30},${by - 14} Q ${bx - 30},${by - 46} ${bx},${by - 46} Q ${bx + 30},${by - 46} ${bx + 30},${by - 14} Q ${bx + 30},${by + 14} ${bx + 46},${by + 26} Z" fill="#f2c14e"/>`;
    s += `<circle cx="${bx}" cy="${by - 48}" r="6" fill="#f2c14e"/><circle cx="${bx}" cy="${by + 32}" r="9" fill="#d99a1c"/>`;
    for (const d of [-1, 1]) {
      s += `<path d="M ${bx + d * 58},${by - 22} Q ${bx + d * 68},${by} ${bx + d * 58},${by + 22}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`;
      s += `<path d="M ${bx + d * 72},${by - 30} Q ${bx + d * 86},${by} ${bx + d * 72},${by + 30}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>`;
    }
    s += `<rect x="0" y="108" width="${w}" height="42" fill="#02101f"/>`;
    s += `<text x="14" y="139" ${HEAD_FONT} font-size="30" fill="#ffffff">ANT</text>`;
    s += `<text x="76" y="139" ${HEAD_FONT} font-size="30" fill="#2ee59d">$83 IPO</text>`;
    s += `<text x="${w - 14}" y="139" text-anchor="end" ${HEAD_FONT} font-size="30" fill="#8fd3ff">NASDAQ</text>`;
    return s;
  },

  // A spiral storm over the bay, moving on a coast where a palm bends in the wind.
  cyclone(w, h) {
    let s = `<defs>${gradient('g-cyclone', [[0, '#1b4d68'], [1, '#2f86ab']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-cyclone)"/>`;
    s += `<path d="M 0,0 L 78,0 Q 104,42 84,82 Q 66,120 98,${h} L 0,${h} Z" fill="#d9c58a"/>`;
    s += `<path d="M 0,0 L 62,0 Q 88,42 68,82 Q 50,120 80,${h} L 0,${h} Z" fill="#5fa55a"/>`;
    const cx = 214, cy = 76;
    for (const phase of [0, Math.PI]) {
      const pts = [];
      for (let t = 0.5; t <= 5.2; t += 0.15) {
        const r = 7 + t * 11.5;
        pts.push(`${n(cx + r * Math.cos(t + phase))},${n(cy + r * 0.86 * Math.sin(t + phase))}`);
      }
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="#ffffff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="7" fill="#1b4d68"/>`;
    s += `<path d="M 150,112 L 112,112" stroke="#ffd166" stroke-width="7" stroke-linecap="round"/><polygon points="98,112 116,100 116,124" fill="#ffd166"/>`;
    for (const [x, y] of [[104, 20], [124, 44], [108, 70], [128, 134], [96, 96]]) s += `<path d="M ${x},${y} l -8,14" stroke="#cfe8f5" stroke-width="2.5" stroke-linecap="round"/>`;
    s += palm(50, h - 4, 70, -8, '#1f3d24');
    return s;
  },

  // Two flags over a signed paper.
  pact(w, h) {
    let s = `<defs>${gradient('g-pact', [[0, '#f6ecd4'], [1, '#e3d2a8']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-pact)"/>`;
    s += flagOnPole(flagUS, 56, 20, h, 86, 56) + flagOnPole(flagVenezuela, 182, 20, h, 86, 56);
    s += `<rect x="96" y="92" width="150" height="50" rx="3" fill="#ffffff" stroke="#8a7a52" stroke-width="2"/>`;
    for (const y of [104, 113]) s += `<rect x="108" y="${y}" width="126" height="3" fill="#b9b3a3"/>`;
    s += `<path d="M 110,132 q 8,-12 14,0 q 6,10 12,-2 q 6,-10 12,2 q 4,6 12,0" fill="none" stroke="#1f3a8a" stroke-width="2.5" stroke-linecap="round"/>`;
    s += `<path d="M 186,134 q 8,-12 14,-2 q 6,8 12,-2 q 6,-8 14,2" fill="none" stroke="#1f3a8a" stroke-width="2.5" stroke-linecap="round"/>`;
    s += `<g transform="rotate(-38 272 110)"><rect x="244" y="106" width="56" height="9" rx="3" fill="#1b2a4a"/><polygon points="244,106 232,110.5 244,115" fill="#f2c14e"/></g>`;
    return s;
  },

  // A game controller under a neon sunset: a blockbuster video game's release night.
  game(w, h) {
    let s = `<defs>${gradient('g-game', [[0, '#2b1055'], [0.55, '#d6336c'], [1, '#ff9a3c']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-game)"/>`;
    s += `<circle cx="163" cy="${h + 6}" r="62" fill="#ffd166" opacity="0.9"/>`;
    s += `<circle cx="288" cy="30" r="15" fill="#fff3b0"/><circle cx="295" cy="25" r="13" fill="#3b1560"/>`;
    s += palm(34, h, 96, 12, '#1a0b2e') + palm(296, h, 82, -14, '#1a0b2e');
    const body = '#15151f';
    s += `<circle cx="104" cy="104" r="27" fill="${body}"/><circle cx="222" cy="104" r="27" fill="${body}"/>`;
    s += `<rect x="92" y="52" width="142" height="62" rx="27" fill="${body}" stroke="#ffffff" stroke-width="0"/>`;
    s += `<rect x="104" y="78" width="30" height="9" rx="2" fill="#d8d8e6"/><rect x="114.5" y="67.5" width="9" height="30" rx="2" fill="#d8d8e6"/>`;
    for (const [x, y, c] of [[206, 70, '#4dd0a6'], [220, 83, '#ff6b6b'], [192, 83, '#6fa8ff'], [206, 96, '#ffd166']]) s += `<circle cx="${x}" cy="${y}" r="6.5" fill="${c}"/>`;
    s += `<text x="163" y="94" text-anchor="middle" ${HEAD_FONT} font-size="30" fill="#ffffff">VI</text>`;
    return s;
  },
};

// ---------------------------------------------------------------------------------------------
// Page layout: a header that names the day, one wide lead story, seven tiles, a footer line.
// ---------------------------------------------------------------------------------------------

const MARGIN = 12, GAP = 11, COL_W = 326, ROW_H = 280, TOP = 128, ART_H = 150;

function card(story, x, y, w, index) {
  const lead = Boolean(story.lead);
  const pad = 14;
  const tagSize = lead ? 24 : 22;
  const headSize = lead ? 56 : 35;
  const tagY = y + ART_H + (lead ? 28 : 28);
  const line1 = tagY + (lead ? 49 : 37);
  const line2 = line1 + (lead ? 48 : 37);
  let s = `<defs><clipPath id="card-${index}"><rect x="${x}" y="${y}" width="${w}" height="${ROW_H}" rx="12"/></clipPath>`
    + `<clipPath id="art-${index}"><rect x="0" y="0" width="${w}" height="${ART_H}"/></clipPath></defs>`;
  s += `<rect x="${x}" y="${y + 3}" width="${w}" height="${ROW_H}" rx="12" fill="#00000026"/>`;
  s += `<g clip-path="url(#card-${index})">`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${ROW_H}" fill="#ffffff"/>`;
  s += `<g transform="translate(${x} ${y})"><g clip-path="url(#art-${index})">${ART[story.art](w, ART_H)}</g></g>`;
  s += `<rect x="${x}" y="${y + ART_H}" width="${w}" height="5" fill="${story.accent}"/>`;
  s += `</g>`;
  s += `<text x="${x + pad}" y="${tagY}" ${HEAD_FONT} font-size="${tagSize}" letter-spacing="1" fill="${story.accent}" data-fit="${w - 2 * pad}">${esc(story.tag)}</text>`;
  s += `<text x="${x + pad}" y="${line1}" ${HEAD_FONT} font-size="${headSize}" fill="#111827" data-fit="${w - 2 * pad}">${esc(story.lines[0])}</text>`;
  s += `<text x="${x + pad}" y="${line2}" ${HEAD_FONT} font-size="${headSize}" fill="#111827" data-fit="${w - 2 * pad}">${esc(story.lines[1])}</text>`;
  return s;
}

function page() {
  const colX = (c) => MARGIN + c * (COL_W + GAP);
  const rowY = (r) => TOP + r * (ROW_H + 10);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">`;
  s += `<rect width="${SIZE}" height="${SIZE}" fill="#e9e3d5"/>`;

  // Header: the day this picture sums up.
  s += `<rect width="${SIZE}" height="114" fill="#0f1b33"/><rect y="114" width="${SIZE}" height="5" fill="#d7263d"/>`;
  s += `<text x="${SIZE / 2}" y="34" text-anchor="middle" ${HEAD_FONT} font-size="24" letter-spacing="5" fill="#f2c14e">THE WORLD'S NEWS IN ONE PICTURE</text>`;
  s += `<text x="${SIZE / 2}" y="101" text-anchor="middle" ${HEAD_FONT} font-size="74" letter-spacing="1" fill="#ffffff" data-fit="${SIZE - 48}">${DAY}</text>`;

  // The lead takes two columns of the first row; the other stories fill the grid in order.
  const slots = [[0, 0, 2], [2, 0, 1], [0, 1, 1], [1, 1, 1], [2, 1, 1], [0, 2, 1], [1, 2, 1], [2, 2, 1]];
  STORIES.forEach((story, i) => {
    const [c, r, span] = slots[i];
    s += card(story, colX(c), rowY(r), COL_W * span + GAP * (span - 1), i);
  });

  // Footer.
  s += `<rect y="${SIZE - 30}" width="${SIZE}" height="30" fill="#0f1b33"/>`;
  s += `<text x="${SIZE / 2}" y="${SIZE - 9}" text-anchor="middle" ${HEAD_FONT} font-size="20" letter-spacing="3" fill="#ffffff">EIGHT STORIES · ONE DAY · THURSDAY 19 NOVEMBER 2026</text>`;
  return s + `</svg>`;
}

// The page shrinks any line of text that is wider than its box, then it is ready to be captured.
const FIT_SCRIPT = `
for (const t of document.querySelectorAll('text[data-fit]')) {
  const max = Number(t.dataset.fit), len = t.getComputedTextLength();
  if (len > max) t.setAttribute('font-size', (parseFloat(t.getAttribute('font-size')) * max / len).toFixed(2));
}`;

function html() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${DAY}</title>`
    + `<style>html,body{margin:0;padding:0;background:#e9e3d5;overflow:hidden}svg{display:block}</style></head>`
    + `<body>${page()}<script>${FIT_SCRIPT}</script></body></html>`;
}

// ---------------------------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------------------------

const BROWSERS = [
  process.env.BROWSER_BIN,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

function render(htmlFile, pngFile) {
  const browser = BROWSERS.find((b) => existsSync(b));
  if (!browser) throw new Error('No headless browser found: set BROWSER_BIN to a Chromium-based browser.');
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${SIZE},${SIZE}`, `--screenshot=${pngFile}`, pathToFileURL(htmlFile).href,
  ], { stdio: 'ignore' });
  const bytes = statSync(pngFile).size;
  if (bytes > 1048576) throw new Error(`entry.png is ${bytes} bytes: over the 1 MiB limit.`);
  console.log(`rendered ${pngFile} (${bytes} bytes) with ${browser}`);
}

const buildDir = join(ROOT, 'build');
mkdirSync(buildDir, { recursive: true });
const htmlFile = join(buildDir, 'entry.html');
writeFileSync(htmlFile, html());
console.log(`wrote ${htmlFile}`);
if (process.argv.includes('--render')) render(htmlFile, join(ROOT, 'entry.png'));
