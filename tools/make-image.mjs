// Draws the entry: one 1024 x 1024 picture of the world's news of Thursday 19 November 2026.
//
//   node tools/make-image.mjs            writes build/entry.html (the picture as one inline SVG)
//   node tools/make-image.mjs --render   also renders it to entry.png with a local headless browser
//
// Everything in the picture is drawn here as vector shapes; no outside artwork is used.
// The stories are data (STORIES and BRIEFS below), so the wording can follow the day as it unfolds.

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

// Every story belongs to the region where it happened; the colour runs through the whole page.
const REGIONS = {
  asia: { name: 'ASIA', color: '#b3261e' },
  oceania: { name: 'OCEANIA', color: '#7c3aed' },
  mideast: { name: 'MIDDLE EAST', color: '#b45309' },
  europe: { name: 'EUROPE', color: '#1d4ed8' },
  africa: { name: 'AFRICA', color: '#15803d' },
  americas: { name: 'AMERICAS', color: '#0e7490' },
  world: { name: 'WORLD', color: '#475569' },
};

// The illustrated stories, in page order: the lead, two cards beside it, then two rows of four.
// Each has its place and field, a two-line headline and the drawing that shows it.
const STORIES = [
  {
    art: 'summit', lead: true, region: 'asia',
    tag: 'SHENZHEN, CHINA · APEC SUMMIT',
    lines: ['TRUMP, XI AND PUTIN MEET', 'FOR FIRST THREE-WAY SUMMIT'],
    deck: ['All three together for the first time: nuclear arms, Iran and Ukraine on the agenda'],
  },
  {
    art: 'missiles', region: 'mideast',
    tag: 'RIYADH · IRAN WAR',
    lines: ['MISSILES TARGET RIYADH', 'AS IRAN WAR WIDENS'],
    deck: ['Houthis claim cruise-missile strike;', 'a blast is heard at 4 am Thursday'],
  },
  {
    art: 'court', region: 'europe',
    tag: 'THE HAGUE · JUSTICE',
    lines: ['ROHINGYA GENOCIDE CASE:', 'WORLD COURT VERDICT DAY'],
    deck: ['The Gambia v Myanmar: the ICJ is due', 'to give its final, binding judgment'],
  },
  {
    art: 'climate', region: 'world',
    tag: 'ANTALYA · CLIMATE',
    lines: ['COP31 TALKS DEADLOCKED', 'A DAY BEFORE CLOSE'],
    deck: ['21 issues still open, climate finance', 'among them; talks close on Friday'],
  },
  {
    art: 'allies', region: 'europe',
    tag: 'BERLIN · UKRAINE',
    lines: ["UKRAINE'S ALLIES MEET", 'ON FUNDING AND PEACE'],
    deck: ['Merz hosts over 20 leaders on paying', "for Kyiv's defence in 2027"],
  },
  {
    art: 'market', region: 'americas',
    tag: 'NEW YORK · MARKETS',
    lines: ['ANTHROPIC NASDAQ DEBUT', 'AFTER $83-A-SHARE IPO'],
    deck: ['The AI firm priced above its range;', 'shares, ticker ANT, due to trade today'],
  },
  {
    art: 'pact', region: 'americas',
    tag: 'CARACAS · DEFENCE',
    lines: ['US AND VENEZUELA', 'SIGN MILITARY PACT'],
    deck: ['Hegseth, on a surprise visit, announces', 'joint training and shared intelligence'],
  },
  {
    art: 'cyclone', region: 'asia',
    tag: 'INDIA · WEATHER',
    lines: ['CYCLONE AKVAN NEARS:', '50,000 EVACUATED'],
    deck: ['Odisha shuts schools in six districts;', 'landfall is forecast for Friday'],
  },
  {
    art: 'exam', region: 'asia',
    tag: 'SEOUL · EDUCATION',
    lines: ['550,000 SIT PENCIL-ONLY', 'EXAM TO FOIL AI CHEATS'],
    deck: ['Emergency alerts sound nationwide', 'to expose hidden phones'],
  },
  {
    art: 'cricket', region: 'oceania',
    tag: 'WELLINGTON · CRICKET',
    lines: ['NEW ZEALAND v INDIA:', 'FIRST TEST BEGINS'],
    deck: ['Five days of play in Wellington,', 'scheduled through 23 November'],
  },
  {
    art: 'game', region: 'world',
    tag: 'WORLDWIDE · GAMING',
    lines: ['GRAND THEFT AUTO VI', 'GOES ON SALE'],
    deck: ['Unlocks at midnight local time, the', 'first new game in the series in 13 years'],
  },
];

// One line under the date that says what kind of day it was.
const STRAPLINE = 'A first US–China–Russia summit · a genocide verdict due · a widening Gulf war · climate talks stuck · Grand Theft Auto VI is out';

// The day in six figures: [figure, what it counts, region].
const NUMBERS = [
  ['1st', 'US–China–Russia summit', 'asia'],
  ['21', 'issues still open at COP31', 'world'],
  ['$83', 'Anthropic IPO share price', 'americas'],
  ['$92', 'a barrel of Brent oil', 'mideast'],
  ['50,000', 'moved from Akvan’s path', 'asia'],
  ['550,000', 'sit South Korea’s exam', 'asia'],
];

// The briefs: one line each, [region, place, what happened], read down the three columns.
const BRIEFS = [
  ['asia', 'JAKARTA', 'Rate raised to 6% to shield rupiah'],
  ['asia', 'FLORES', '5.8 quake; no casualties reported'],
  ['asia', 'TOKYO', 'India, Japan hold 2+2 security talks'],
  ['asia', 'TOKYO', 'Quad plans joint patrol drill in 2027'],
  ['asia', 'SHENZHEN', 'IMF: inflation 4.7%, tighten policy'],
  ['asia', 'SEOUL', 'Top court verdict due on ex-PM Han'],
  ['asia', 'NEW DELHI', 'Schools reopen as smog curbs ease'],
  ['asia', 'BANGKOK', 'Thailand sees US trade pact in 2 months'],
  ['oceania', 'COOK ISLANDS', 'Cyclone Xavier: NZ relief team lands'],
  ['oceania', 'WELLINGTON', 'Election counted; winner still unclear'],
  ['oceania', 'CANBERRA', 'A$100m pledged to Pacific climate fund'],
  ['mideast', 'GAZA', 'Israel orders civilians out in new push'],
  ['mideast', 'GULF', 'Oil holds near $92 as attacks mount'],
  ['europe', 'OSLO', 'Norway, Germany: $300m each for Kyiv arms'],
  ['africa', 'HARARE', 'Court reserves ruling on Mnangagwa term'],
  ['africa', 'JOHANNESBURG', 'ANC coalition talks drag on'],
  ['americas', 'WASHINGTON', 'Democrats pick Jeffries for Speaker'],
  ['americas', 'WASHINGTON', 'Trump claims Iran eyeing bio-weapons'],
  ['americas', 'OTTAWA', 'Canada sanctions West Bank settlers'],
  ['americas', 'BOGOTA', 'Teachers join strike over tax plan'],
  ['americas', 'WASHINGTON', 'AI chip curbs take in five more countries'],
  ['americas', 'VANDENBERG', 'Space Force launch due on Falcon 9'],
  ['world', 'MARKETS', 'Gold near $3,730, a one-year low'],
  ['world', 'SCIENCE', 'Nature: stone drew early humans to Arabia'],
];

// ---------------------------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------------------------

const n = (v) => Number(v.toFixed(1));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = "font-family=\"Bahnschrift, 'Arial Narrow', Arial, sans-serif\" font-stretch=\"75%\"";
const HEAD_FONT = `${FONT} font-weight="700"`;

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

function bands(x, y, w, h, colors) {
  const b = h / colors.length;
  return colors.map((c, i) => `<rect x="${x}" y="${n(y + i * b)}" width="${w}" height="${n(b)}" fill="${c}"/>`).join('');
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

const flagRussia = (x, y, w, h) => flagFrame(x, y, w, h, bands(x, y, w, h, ['#ffffff', '#0039a6', '#d52b1e']));
const flagUkraine = (x, y, w, h) => flagFrame(x, y, w, h, bands(x, y, w, h, ['#0057b7', '#ffd700']));

function flagVenezuela(x, y, w, h) {
  let s = bands(x, y, w, h, ['#ffcc00', '#00247d', '#cf142b']);
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (1.15 + (i * 0.7) / 7);
    s += `<circle cx="${n(x + w / 2 + w * 0.2 * Math.cos(a))}" cy="${n(y + h * 0.66 + h * 0.22 * Math.sin(a))}" r="${n(h * 0.035)}" fill="#ffffff"/>`;
  }
  return flagFrame(x, y, w, h, s);
}

function flagEurope(x, y, w, h) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#003399"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    s += `<circle cx="${n(x + w / 2 + h * 0.32 * Math.cos(a))}" cy="${n(y + h / 2 + h * 0.32 * Math.sin(a))}" r="${n(h * 0.05)}" fill="#ffcc00"/>`;
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
// The drawings. Each fills a w x h box whose top-left corner is (0, 0): 663 x 150 for the lead,
// 326 x 150 for the others. The page scales them to the size of their cards.
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
    s += `<rect x="34" y="116" width="${w - 68}" height="${h - 116}" rx="4" fill="#7a4a21"/>`;
    s += `<rect x="34" y="116" width="${w - 68}" height="5" rx="2" fill="#a86a34"/>`;
    for (const p of people) {
      s += `<rect x="${p.cx - 42}" y="124" width="84" height="24" rx="3" fill="#ffffff"/>`;
      s += `<text x="${p.cx}" y="143" text-anchor="middle" ${HEAD_FONT} font-size="21" fill="#111827">${p.plate}</text>`;
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

  // Berlin's gate between the flags of Ukraine and the European Union: Kyiv's allies gather.
  allies(w, h) {
    let s = `<defs>${gradient('g-allies', [[0, '#bcd9f7'], [1, '#e6f1fc']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-allies)"/>`;
    const stone = '#c9b68b', shade = '#a8956a';
    for (let i = 0; i < 6; i++) s += `<rect x="${78 + i * 32}" y="62" width="14" height="${h - 62}" fill="${stone}"/>`;
    s += `<rect x="66" y="44" width="194" height="20" fill="${stone}"/><rect x="66" y="60" width="194" height="4" fill="${shade}"/>`;
    s += `<rect x="92" y="28" width="142" height="16" fill="${stone}"/>`;
    s += `<rect x="146" y="18" width="34" height="10" fill="${shade}"/><polygon points="150,18 163,4 176,18" fill="${shade}"/>`;
    s += `<rect x="0" y="${h - 8}" width="${w}" height="8" fill="${shade}"/>`;
    s += flagOnPole(flagUkraine, 12, 34, h, 46, 31) + flagOnPole(flagEurope, 270, 34, h, 46, 31);
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
    const bx = 226, by = 56;
    s += `<path d="M ${bx - 46},${by + 26} Q ${bx - 30},${by + 14} ${bx - 30},${by - 14} Q ${bx - 30},${by - 46} ${bx},${by - 46} Q ${bx + 30},${by - 46} ${bx + 30},${by - 14} Q ${bx + 30},${by + 14} ${bx + 46},${by + 26} Z" fill="#f2c14e"/>`;
    s += `<circle cx="${bx}" cy="${by - 48}" r="6" fill="#f2c14e"/><circle cx="${bx}" cy="${by + 32}" r="9" fill="#d99a1c"/>`;
    for (const d of [-1, 1]) {
      s += `<path d="M ${bx + d * 58},${by - 22} Q ${bx + d * 68},${by} ${bx + d * 58},${by + 22}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`;
      s += `<path d="M ${bx + d * 72},${by - 30} Q ${bx + d * 86},${by} ${bx + d * 72},${by + 30}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>`;
    }
    s += `<rect x="0" y="104" width="${w}" height="46" fill="#02101f"/>`;
    s += `<text x="12" y="139" ${HEAD_FONT} font-size="36" fill="#ffffff">ANT</text>`;
    s += `<text x="84" y="139" ${HEAD_FONT} font-size="36" fill="#2ee59d">$83 IPO</text>`;
    s += `<text x="${w - 12}" y="139" text-anchor="end" ${HEAD_FONT} font-size="36" fill="#8fd3ff">NASDAQ</text>`;
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

  // An answer sheet, a pencil, and a struck-out AI: the exam that banned everything else.
  exam(w, h) {
    let s = `<defs>${gradient('g-exam', [[0, '#d8efe6'], [1, '#a9d8c6']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-exam)"/>`;
    s += `<g transform="rotate(-4 96 76)"><rect x="22" y="16" width="150" height="120" rx="4" fill="#ffffff" stroke="#6b8f82" stroke-width="2"/>`;
    const filled = new Set(['0-1', '1-3', '2-0', '3-2', '4-4']);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      s += `<circle cx="${46 + c * 26}" cy="${36 + r * 21}" r="7" fill="${filled.has(`${r}-${c}`) ? '#1f2937' : '#ffffff'}" stroke="#1f2937" stroke-width="2"/>`;
    }
    s += `</g>`;
    s += `<g transform="rotate(-34 226 62)">`
      + `<rect x="160" y="52" width="118" height="20" fill="#f6b40e"/><rect x="160" y="58" width="118" height="5" fill="#d99a06"/>`
      + `<rect x="278" y="52" width="9" height="20" fill="#9aa3ad"/><rect x="287" y="52" width="16" height="20" rx="4" fill="#f28b9b"/>`
      + `<polygon points="160,52 160,72 134,62" fill="#ecd2a6"/><polygon points="143,58.5 143,65.5 134,62" fill="#1f2937"/></g>`;
    s += `<circle cx="276" cy="112" r="27" fill="#ffffff" stroke="#d7263d" stroke-width="7"/>`;
    s += `<text x="276" y="122" text-anchor="middle" ${HEAD_FONT} font-size="30" fill="#1f2937">AI</text>`;
    s += `<path d="M 257,131 L 295,93" stroke="#d7263d" stroke-width="7" stroke-linecap="round"/>`;
    return s;
  },

  // Stumps, a bat and a red ball on a green field: a Test match gets under way.
  cricket(w, h) {
    let s = `<defs>${gradient('g-cricket', [[0, '#4aa85a'], [1, '#2b7a3d']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-cricket)"/>`;
    s += `<polygon points="126,${h} 200,${h} 184,40 142,40" fill="#dcc58c"/>`;
    for (const x of [150, 160.5, 171]) s += `<rect x="${x}" y="48" width="5" height="62" rx="2" fill="#fff4d6" stroke="#8a6d2f" stroke-width="1"/>`;
    s += `<rect x="149" y="44" width="28" height="5" rx="2" fill="#8a6d2f"/>`;
    s += `<g transform="rotate(24 244 80)"><rect x="239" y="10" width="10" height="34" rx="3" fill="#1f2937"/>`
      + `<rect x="230" y="42" width="28" height="86" rx="7" fill="#e7c88c" stroke="#8a6d2f" stroke-width="2"/></g>`;
    s += `<circle cx="92" cy="92" r="15" fill="#c1121f"/><path d="M 80,84 Q 92,92 104,100" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="3 3"/>`;
    s += `<rect x="10" y="10" width="112" height="34" rx="4" fill="#12301b"/>`;
    s += `<text x="66" y="35" text-anchor="middle" ${HEAD_FONT} font-size="26" fill="#ffffff">NZ v IND</text>`;
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
    s += `<rect x="92" y="52" width="142" height="62" rx="27" fill="${body}"/>`;
    s += `<rect x="104" y="78" width="30" height="9" rx="2" fill="#d8d8e6"/><rect x="114.5" y="67.5" width="9" height="30" rx="2" fill="#d8d8e6"/>`;
    for (const [x, y, c] of [[206, 70, '#4dd0a6'], [220, 83, '#ff6b6b'], [192, 83, '#6fa8ff'], [206, 96, '#ffd166']]) s += `<circle cx="${x}" cy="${y}" r="6.5" fill="${c}"/>`;
    s += `<text x="163" y="95" text-anchor="middle" ${HEAD_FONT} font-size="34" fill="#ffffff">VI</text>`;
    return s;
  },
};

// ---------------------------------------------------------------------------------------------
// Page layout: a header that names the day, a bar that counts the stories by region, the lead
// and ten illustrated cards on a four-column grid, three columns of briefs, and a footer.
// ---------------------------------------------------------------------------------------------

const MARGIN = 12, GAP = 8, COLS = 4;
const COL_W = (SIZE - 2 * MARGIN - (COLS - 1) * GAP) / COLS; // 244
const ART_H = 150; // the height every drawing is made for, before it is scaled to its card
const ROWS = [{ y: 180, h: 212 }, { y: 398, h: 212 }, { y: 616, h: 212 }];
const TOTAL = STORIES.length + BRIEFS.length;

function card(story, x, y, w, h, index) {
  const lead = Boolean(story.lead);
  const baseW = lead ? 663 : 326;
  const scale = w / baseW;
  const artH = n(ART_H * scale);
  const color = REGIONS[story.region].color;
  const pad = lead ? 14 : 10;
  const tagSize = lead ? 19 : 16;
  const headSize = lead ? 32 : 23;
  const tagY = n(y + artH + 4 + (lead ? 19 : 16));
  const line1 = tagY + (lead ? 30 : 22);
  const line2 = line1 + (lead ? 29 : 21);
  const deckSize = lead ? 15 : 14;
  const fit = `data-fit="${w - 2 * pad}"`;
  let s = `<defs><clipPath id="card-${index}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/></clipPath>`
    + `<clipPath id="art-${index}"><rect x="0" y="0" width="${baseW}" height="${ART_H}"/></clipPath></defs>`;
  s += `<rect x="${x}" y="${y + 2}" width="${w}" height="${h}" rx="9" fill="#00000026"/>`;
  s += `<g clip-path="url(#card-${index})">`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>`;
  s += `<g transform="translate(${x} ${y}) scale(${scale.toFixed(4)})"><g clip-path="url(#art-${index})">${ART[story.art](baseW, ART_H)}</g></g>`;
  s += `<rect x="${x}" y="${n(y + artH)}" width="${w}" height="4" fill="${color}"/>`;
  s += `</g>`;
  s += `<text x="${x + pad}" y="${tagY}" ${HEAD_FONT} font-size="${tagSize}" letter-spacing="0.6" fill="${color}" ${fit}>${esc(story.tag)}</text>`;
  s += `<text x="${x + pad}" y="${line1}" ${HEAD_FONT} font-size="${headSize}" fill="#111827" ${fit}>${esc(story.lines[0])}</text>`;
  s += `<text x="${x + pad}" y="${line2}" ${HEAD_FONT} font-size="${headSize}" fill="#111827" ${fit}>${esc(story.lines[1])}</text>`;
  (story.deck ?? []).forEach((text, i) => {
    s += `<text x="${x + pad}" y="${line2 + 16 + i * 14.5}" ${FONT} font-weight="600" font-size="${deckSize}" fill="#3f4a5a" ${fit}>${esc(text)}</text>`;
  });
  return s;
}

// One coloured segment for each region, as wide as its share of the day's stories.
function regionBar(y, h) {
  const counts = {};
  for (const story of STORIES) counts[story.region] = (counts[story.region] ?? 0) + 1;
  for (const [region] of BRIEFS) counts[region] = (counts[region] ?? 0) + 1;
  const keys = Object.keys(REGIONS).filter((k) => counts[k]);
  const width = SIZE - 2 * MARGIN, floor = 104;
  const spare = width - floor * keys.length;
  let x = MARGIN, s = '';
  for (const key of keys) {
    const w = floor + (spare * counts[key]) / TOTAL;
    s += `<rect x="${n(x)}" y="${y}" width="${n(w + 0.5)}" height="${h}" fill="${REGIONS[key].color}"/>`;
    s += `<text x="${n(x + w / 2)}" y="${y + h - 6}" text-anchor="middle" ${HEAD_FONT} font-size="16" letter-spacing="1" fill="#ffffff">${REGIONS[key].name} ${counts[key]}</text>`;
    x += w;
  }
  return s;
}

// Six figures side by side: each a number from one of the day's stories and what it counts.
function numbers(y, h) {
  const cell = (SIZE - 2 * MARGIN) / NUMBERS.length;
  let s = `<rect x="${MARGIN}" y="${y}" width="${SIZE - 2 * MARGIN}" height="${h}" rx="6" fill="#fbf8f1"/>`;
  NUMBERS.forEach(([figure, caption, region], i) => {
    const x = MARGIN + i * cell;
    if (i > 0) s += `<rect x="${n(x)}" y="${y + 6}" width="1" height="${h - 12}" fill="#c9c1ae"/>`;
    s += `<text x="${n(x + cell / 2)}" y="${y + 22}" text-anchor="middle" ${HEAD_FONT} font-size="25" fill="${REGIONS[region].color}">${esc(figure)}</text>`;
    s += `<text x="${n(x + cell / 2)}" y="${y + 37}" text-anchor="middle" ${FONT} font-weight="600" font-size="15" fill="#3f4a5a" data-fit="${n(cell - 10)}">${esc(caption)}</text>`;
  });
  return s;
}

// The briefs run down three columns: a square in the region's colour, the place, then the news.
function briefs(y) {
  const colW = (SIZE - 2 * MARGIN - 2 * 14) / 3, perCol = Math.ceil(BRIEFS.length / 3), step = 18;
  let s = `<rect x="${MARGIN}" y="${y}" width="${SIZE - 2 * MARGIN}" height="3" fill="#0f1b33"/>`;
  s += `<text x="${MARGIN}" y="${y + 21}" ${HEAD_FONT} font-size="18" letter-spacing="2" fill="#0f1b33">ALSO ON ${DAY}</text>`;
  s += `<text x="${SIZE - MARGIN}" y="${y + 21}" text-anchor="end" ${HEAD_FONT} font-size="15" letter-spacing="1" fill="#475569">${BRIEFS.length} MORE STORIES, BY REGION</text>`;
  BRIEFS.forEach(([region, place, text], i) => {
    const x = MARGIN + Math.floor(i / perCol) * (colW + 14);
    const lineY = y + 39 + (i % perCol) * step;
    const color = REGIONS[region].color;
    s += `<rect x="${n(x)}" y="${lineY - 11}" width="10" height="10" rx="2" fill="${color}"/>`;
    s += `<text x="${n(x + 16)}" y="${lineY}" ${FONT} font-size="16.5" data-fit="${n(colW - 16)}">`
      + `<tspan font-weight="700" fill="${color}">${esc(place)}</tspan><tspan font-weight="600" fill="#111827"> ${esc(text)}</tspan></text>`;
  });
  return s;
}

function page() {
  const colX = (c) => MARGIN + c * (COL_W + GAP);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">`;
  s += `<rect width="${SIZE}" height="${SIZE}" fill="#e9e3d5"/>`;

  // Header: the day this picture sums up.
  s += `<rect width="${SIZE}" height="108" fill="#0f1b33"/>`;
  s += `<text x="${MARGIN + 2}" y="21" ${HEAD_FONT} font-size="17" letter-spacing="3" fill="#f2c14e">THE WORLD'S NEWS IN ONE PICTURE</text>`;
  s += `<text x="${SIZE - MARGIN - 2}" y="21" text-anchor="end" ${HEAD_FONT} font-size="17" letter-spacing="3" fill="#f2c14e">${TOTAL} STORIES · ${Object.keys(REGIONS).length} REGIONS · ONE DAY</text>`;
  s += `<text x="${SIZE / 2}" y="77" text-anchor="middle" ${HEAD_FONT} font-size="62" letter-spacing="1" fill="#ffffff" data-fit="${SIZE - 40}">${DAY}</text>`;
  s += `<text x="${SIZE / 2}" y="100" text-anchor="middle" ${FONT} font-weight="600" font-style="italic" font-size="17" fill="#f6e7bd" data-fit="${SIZE - 32}">${esc(STRAPLINE)}</text>`;
  s += regionBar(108, 22);
  s += numbers(133, 42);

  // The lead takes two columns of the first row; the other stories fill the grid in order.
  const slots = [[0, 0, 2], [2, 0, 1], [3, 0, 1], [0, 1, 1], [1, 1, 1], [2, 1, 1], [3, 1, 1], [0, 2, 1], [1, 2, 1], [2, 2, 1], [3, 2, 1]];
  STORIES.forEach((story, i) => {
    const [c, r, span] = slots[i];
    s += card(story, colX(c), ROWS[r].y, COL_W * span + GAP * (span - 1), ROWS[r].h, i);
  });

  s += briefs(832);

  // Footer: how the page was put together.
  s += `<rect y="${SIZE - 22}" width="${SIZE}" height="22" fill="#0f1b33"/>`;
  s += `<text x="${SIZE / 2}" y="${SIZE - 6}" text-anchor="middle" ${FONT} font-weight="600" font-size="14.5" letter-spacing="0.6" fill="#e2e8f0">`
    + `From news reports of 19 November 2026 in any time zone · events still to come are worded as due · claims are attributed</text>`;
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
console.log(`wrote ${htmlFile} (${STORIES.length} illustrated stories, ${BRIEFS.length} briefs)`);
if (process.argv.includes('--render')) render(htmlFile, join(ROOT, 'entry.png'));
