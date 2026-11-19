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
// Each has its place and field, a two-line headline, the drawing that shows it, and `at`, its
// [longitude, latitude] for the pin on the map.
const STORIES = [
  {
    art: 'summit', lead: true, region: 'asia', at: [114.1, 22.5], focus: 0.45,
    tag: 'SHENZHEN, CHINA · APEC SUMMIT',
    lines: ['FIRST TRUMP–XI–PUTIN TALKS', 'END WITH NO DEAL ANNOUNCED'],
    deck: ['Xi calls the talks “groundbreaking”; Trump pitches nuclear arms cuts and raises Iran;',
      'Putin sees a shared “interest” in ending the Ukraine war; no joint statement so far'],
  },
  {
    art: 'game', region: 'world', at: [174.8, -36.8], focus: 0.55,
    tag: 'WORLDWIDE · GAMING',
    lines: ['GTA VI GOES ON SALE', 'AFTER A 13-YEAR WAIT'],
    deck: ['$79.99 on PS5 and Xbox, no PC yet;', 'its 99 ties Metacritic’s best score;', 'PlayStation Network hit by outage'],
  },
  {
    art: 'market', region: 'americas', at: [-74, 40.7], focus: 0.9,
    tag: 'NEW YORK · MARKETS',
    lines: ['$81BN ANTHROPIC IPO:', 'NASDAQ DEBUT TODAY'],
    deck: ['Priced at $83, above its $70–78 range;', '980m shares, valuing it near $1.5tn;', 'ticker ANT, first trade due later today'],
  },
  {
    art: 'court', region: 'europe', at: [4.3, 52.1], focus: 0.25,
    tag: 'THE HAGUE · JUSTICE',
    lines: ['WORLD COURT: MYANMAR', 'FORCES KILLED THOUSANDS'],
    deck: ['of Rohingya civilians, with “widespread”', 'sexual violence, judges find as they', 'rule on The Gambia’s genocide case'],
  },
  {
    art: 'missiles', region: 'mideast', at: [46.7, 24.7], focus: 0.4,
    tag: 'RIYADH · IRAN WAR',
    lines: ['SAUDI WEALTH FUND’S', 'TOWER HIT IN STRIKE'],
    deck: ['Coalition says debris from a Houthi', 'missile it “dealt with” hit the 80-floor', 'PIF tower; 2nd hit on the district in Nov'],
  },
  {
    art: 'climate', region: 'world', at: [30.7, 36.9], focus: 0.5,
    tag: 'ANTALYA · CLIMATE',
    lines: ['COP31 SPLIT ON FOSSIL', 'FUELS A DAY FROM CLOSE'],
    deck: ['New draft due; $120bn for adaptation', 'and a 35% power-electrification goal', 'for 2035 still in dispute'],
  },
  {
    art: 'allies', region: 'europe', at: [13.4, 52.5], focus: 0.3,
    tag: 'BERLIN · UKRAINE',
    lines: ["UKRAINE'S ALLIES MEET", 'TO FUND ITS DEFENCE'],
    deck: ['Merz, Macron and UK PM Burnham host', 'over 30 leaders; a €45bn EU loan still', 'leaves a €25bn gap for 2027'],
  },
  {
    art: 'cyclone', region: 'asia', at: [85.8, 19.3], focus: 0.5,
    tag: 'ODISHA, INDIA · WEATHER',
    lines: ['CYCLONE AKVAN NEARS:', '80,000 EVACUATED'],
    deck: ['Severe storm, winds of 90–100 km/h,', 'due ashore near Gopalpur by Friday', 'noon; schools in 6 districts shut'],
  },
  {
    art: 'bridge', region: 'europe', at: [36.5, 45.3], focus: 0.5,
    tag: 'KERCH STRAIT · UKRAINE WAR',
    lines: ['DRONES HIT CRIMEAN', 'BRIDGE; TRAINS HALTED'],
    deck: ['Russia suspends rail traffic after', 'an overnight attack, the third since', 'Monday; no casualties reported'],
  },
  {
    art: 'gavel', region: 'asia', at: [127, 37.5], focus: 0.5,
    tag: 'SEOUL · JUSTICE',
    lines: ['TOP COURT VOIDS EX-PM', 'HAN’S MARTIAL-LAW TERM'],
    deck: ['His 15-year sentence goes back for', 'retrial; ex-first lady Kim Keon-hee’s', '4 years for corruption is upheld'],
  },
  {
    art: 'cricket', region: 'oceania', at: [174.8, -41.3], focus: 0,
    tag: 'WELLINGTON · CRICKET',
    lines: ['NICHOLLS 113* LIFTS NZ', 'TO 243/5 v INDIA'],
    deck: ['From 70/5, an unbroken 173 stand with', 'Phillips (94*); Bumrah takes 3 for 52;', 'Nicholls was dropped on 102'],
  },
];

// One line under the date that says what kind of day it was.
const STRAPLINE = 'Trump, Xi and Putin meet · the World Court rules on the Rohingya · drones hit the Crimean bridge · Anthropic lists · GTA VI is out';

// The day in six figures: [figure, what it counts, region].
const NUMBERS = [
  ['$81.3bn', 'Anthropic’s IPO, the largest ever', 'americas'],
  ['99', 'GTA VI’s Metacritic score', 'world'],
  ['80,000', 'moved from Akvan’s path', 'asia'],
  ['4.7%', 'world inflation, says the IMF', 'world'],
  ['4.9%', 'Australia’s jobless rate', 'oceania'],
  ['$92', 'a barrel of Brent oil', 'mideast'],
];

// The briefs: one line each, [region, place, what happened, [longitude, latitude]], numbered on
// from the illustrated stories and read down two columns.
const BRIEFS = [
  ['asia', 'SHENZHEN', 'IMF’s Georgieva: inflation at 4.7%, tighten', [114.1, 22.5]],
  ['asia', 'SHENZHEN', 'APEC adopts leaders’ declaration', [114.1, 22.5]],
  ['asia', 'SEOUL', '551,864 sign up for pencil-only, AI-proof exam', [127, 37.5]],
  ['asia', 'TOKYO', 'India, Japan hold 2+2 defence talks', [139.7, 35.7]],
  ['asia', 'HONG KONG', 'Hang Seng falls 1.8% in morning trade', [114.2, 22.3]],
  ['oceania', 'AUSTRALIA', 'Jobless rate 4.9%, highest since 2021', [149.1, -35.3]],
  ['oceania', 'COOK ISLANDS', 'Cyclone Xavier eases to Category 4', [-159.8, -21.2]],
  ['mideast', 'HORMUZ', 'Iran says 2 supertankers ablaze after mines', [56.3, 26.6]],
  ['mideast', 'GULF', 'Brent oil holds near $92 a barrel', [51.5, 26.5]],
  ['mideast', 'GULF', 'USS George Washington leaves region', [58.5, 23]],
  ['europe', 'BRUSSELS', 'Cyberattack knocks out EU staff systems', [4.4, 50.8]],
  ['europe', 'PODGORICA', 'Montenegro closes 2 more EU entry chapters', [19.3, 42.4]],
  ['europe', 'FRANKFURT', 'German FA backs Diallo to unseat Infantino', [8.7, 50.1]],
  ['africa', 'NAIROBI', "Drought deepens Kenya's milk shortage", [36.8, -1.3]],
  ['americas', 'MIAMI', 'Floods close Miami-Dade schools; Broward too', [-80.2, 26]],
  ['americas', 'BOGOTÁ', '24-hour national strike over tax package', [-74.1, 4.7]],
  ['americas', 'VANDENBERG', 'Falcon 9 to fly Space Force USSF-317', [-120.6, 34.7]],
  ['americas', 'WALL STREET', 'Nasdaq futures jump 1.8% before ANT opens', [-74, 40.7]],
  ['world', 'MARKETS', 'Gold near $3,720, a 14-month low', [-0.1, 51.5]],
];

// Stories left off on purpose because they broke on another day, so a reader can check the date.
const DATE_CHECK = 'kept off as 18 Nov news: Hegseth’s Venezuela pact · Trump weighing Iran strikes · Haiti verdict in Miami · a measles death · EU–Indonesia deal';

const FOOTER = 'Every story happened, or was first reported, on 19 November 2026 in some time zone · claims are attributed · sources: Reuters, AP, AFP, Al Jazeera, CNBC, Nikkei, ABS, IMD, NZ Herald, RTÉ · original drawings';

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

  // A rail bridge over a dark strait, a blast on its deck and a train held at a red signal.
  bridge(w, h) {
    let s = `<defs>${gradient('g-bridge', [[0, '#1e2a44'], [1, '#7286ad']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-bridge)"/>`;
    s += `<rect x="0" y="112" width="${w}" height="${h - 112}" fill="#1d4e6e"/>`;
    for (const [x, y] of [[30, 126], [120, 138], [210, 128], [280, 142], [70, 144]]) s += `<path d="M ${x},${y} q 8,-5 16,0 q 8,5 16,0" fill="none" stroke="#5f9cc0" stroke-width="2"/>`;
    const steel = '#2b3140';
    for (let x = 18; x < w; x += 46) s += `<rect x="${x}" y="84" width="9" height="30" fill="${steel}"/>`;
    s += `<path d="M 116,84 Q 172,22 228,84" fill="none" stroke="${steel}" stroke-width="7"/>`;
    for (const x of [136, 154, 172, 190, 208]) {
      const t = (x - 116) / 112, archY = 84 - 4 * 50 * t * (1 - t);
      s += `<rect x="${x - 1.5}" y="${n(archY)}" width="3" height="${n(84 - archY)}" fill="${steel}"/>`;
    }
    s += `<rect x="0" y="76" width="${w}" height="9" fill="${steel}"/><rect x="0" y="72" width="${w}" height="3" fill="#8a93a6"/>`;
    // The train, stopped short of the bridge, and the signal that holds it.
    s += `<rect x="6" y="54" width="44" height="18" rx="3" fill="#c0392b"/><rect x="52" y="54" width="44" height="18" rx="3" fill="#c0392b"/>`;
    for (const x of [11, 23, 35, 57, 69, 81]) s += `<rect x="${x}" y="58" width="8" height="6" fill="#fde9c9"/>`;
    s += `<rect x="108" y="38" width="3" height="34" fill="#d9d9d9"/><rect x="103" y="30" width="13" height="18" rx="3" fill="#111827"/><circle cx="109.5" cy="39" r="4.5" fill="#ff3b30"/>`;
    // The strike: smoke over a burst on the deck.
    for (const [x, y, r] of [[262, 38, 15], [282, 30, 17], [298, 44, 12], [272, 52, 12]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#4a4f5c" opacity="0.9"/>`;
    s += burst(276, 70, 30, 12, 11, '#ff9f1c') + burst(276, 70, 15, 7, 11, '#ffe066');
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
    s += `<rect x="10" y="10" width="124" height="56" rx="4" fill="#12301b"/>`;
    s += `<text x="72" y="31" text-anchor="middle" ${HEAD_FONT} font-size="17" fill="#cfe8d5">NZ v IND · DAY 1</text>`;
    s += `<text x="72" y="59" text-anchor="middle" ${HEAD_FONT} font-size="30" fill="#ffffff">NZ 243/5</text>`;
    return s;
  },

  // A judge's gavel coming down on its block, a ruling stamped across a case file.
  gavel(w, h) {
    let s = `<defs>${gradient('g-gavel', [[0, '#1f2a44'], [1, '#3b4f7a']])}</defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#g-gavel)"/>`;
    s += `<rect x="0" y="118" width="${w}" height="${h - 118}" fill="#5a3a1e"/><rect x="0" y="118" width="${w}" height="4" fill="#7a4f2a"/>`;
    // The case file and its stamp.
    s += `<g transform="rotate(-6 92 84)"><rect x="26" y="34" width="132" height="92" rx="3" fill="#f4ecd8"/>`;
    for (let y = 50; y < 120; y += 12) s += `<rect x="38" y="${y}" width="${y === 50 ? 70 : 108}" height="4" rx="2" fill="#b8ad96"/>`;
    s += `<rect x="40" y="70" width="104" height="30" rx="3" fill="none" stroke="#c0392b" stroke-width="3.5"/>`;
    s += `<text x="92" y="92" text-anchor="middle" ${HEAD_FONT} font-size="19" fill="#c0392b">RETRIAL</text></g>`;
    // The gavel, its head tilted as it strikes the block.
    s += `<rect x="208" y="108" width="74" height="14" rx="4" fill="#3a2410"/><rect x="214" y="100" width="62" height="10" rx="3" fill="#8a5a2b"/>`;
    s += `<g transform="rotate(-28 246 62)"><rect x="238" y="56" width="104" height="11" rx="5" fill="#a86a34"/>`
      + `<rect x="212" y="30" width="38" height="62" rx="8" fill="#8a5a2b"/><rect x="212" y="40" width="38" height="6" fill="#f2c14e"/><rect x="212" y="76" width="38" height="6" fill="#f2c14e"/></g>`;
    for (const [x1, y1, x2, y2] of [[196, 96, 184, 88], [200, 108, 186, 108], [292, 98, 304, 90]]) s += `<path d="M ${x1},${y1} L ${x2},${y2}" stroke="#f2c14e" stroke-width="3" stroke-linecap="round"/>`;
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
const ROWS = [{ y: 172, h: 202 }, { y: 380, h: 202 }, { y: 588, h: 202 }];
const TOTAL = STORIES.length + BRIEFS.length;

// A numbered disc in a region's colour: the same number marks the story on the map.
function badge(cx, cy, r, number, color, size) {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>`
    + `<text x="${n(cx)}" y="${n(cy + size * 0.36)}" text-anchor="middle" ${HEAD_FONT} font-size="${size}" fill="#ffffff">${number}</text>`;
}

// A card is mostly words: the place and field, the headline, then three lines of explanation with
// the day's figures. The drawing takes whatever height is left, as a strip across the top, and
// `focus` (0 top, 1 bottom) picks which band of the drawing that strip shows.
function card(story, x, y, w, h, index) {
  const lead = Boolean(story.lead);
  const baseW = lead ? 663 : 326;
  const scale = w / baseW;
  const color = REGIONS[story.region].color;
  const pad = lead ? 14 : 10;
  const tagSize = lead ? 18 : 15.5;
  const headSize = lead ? 31 : 22.5;
  const headStep = lead ? 30 : 21;
  const deckSize = lead ? 15.5 : 14;
  const deckStep = lead ? 16.5 : 14.5;
  const deck = story.deck ?? [];
  const below = 4 + (lead ? 19 : 16) + (lead ? 30 : 22) + (story.lines.length - 1) * headStep + 17 + (deck.length - 1) * deckStep + 8;
  const artH = n(h - below);
  const window = artH / scale;
  const top = n((ART_H - window) * (story.focus ?? 0.5));
  const tagY = n(y + artH + 4 + (lead ? 19 : 16));
  const line1 = tagY + (lead ? 30 : 22);
  const lastHead = line1 + (story.lines.length - 1) * headStep;
  const fit = `data-fit="${w - 2 * pad}"`;
  const badgeR = lead ? 10.5 : 9;
  const tagX = x + pad + 2 * badgeR + 5;
  let s = `<defs><clipPath id="card-${index}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/></clipPath>`
    + `<clipPath id="art-${index}"><rect x="0" y="${top}" width="${baseW}" height="${n(window)}"/></clipPath></defs>`;
  s += `<rect x="${x}" y="${y + 2}" width="${w}" height="${h}" rx="9" fill="#00000026"/>`;
  s += `<g clip-path="url(#card-${index})">`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>`;
  s += `<g transform="translate(${x} ${n(y - top * scale)}) scale(${scale.toFixed(4)})"><g clip-path="url(#art-${index})">${ART[story.art](baseW, ART_H)}</g></g>`;
  s += `<rect x="${x}" y="${n(y + artH)}" width="${w}" height="4" fill="${color}"/>`;
  s += `</g>`;
  s += badge(x + pad + badgeR, tagY - tagSize * 0.36, badgeR, index + 1, color, lead ? 15 : 13);
  s += `<text x="${tagX}" y="${tagY}" ${HEAD_FONT} font-size="${tagSize}" letter-spacing="0.6" fill="${color}" data-fit="${x + w - pad - tagX}">${esc(story.tag)}</text>`;
  story.lines.forEach((text, i) => {
    s += `<text x="${x + pad}" y="${line1 + i * headStep}" ${HEAD_FONT} font-size="${headSize}" fill="#111827" ${fit}>${esc(text)}</text>`;
  });
  deck.forEach((text, i) => {
    s += `<text x="${x + pad}" y="${n(lastHead + 17 + i * deckStep)}" ${FONT} font-weight="600" font-size="${deckSize}" fill="#334155" ${fit}>${esc(text)}</text>`;
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
    s += `<text x="${n(x + w / 2)}" y="${y + h - 5}" text-anchor="middle" ${HEAD_FONT} font-size="15" letter-spacing="1" fill="#ffffff">${REGIONS[key].name} ${counts[key]}</text>`;
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
    s += `<text x="${n(x + cell / 2)}" y="${y + 21}" text-anchor="middle" ${HEAD_FONT} font-size="24" fill="${REGIONS[region].color}">${esc(figure)}</text>`;
    s += `<text x="${n(x + cell / 2)}" y="${y + 35}" text-anchor="middle" ${FONT} font-weight="600" font-size="14.5" fill="#3f4a5a" data-fit="${n(cell - 10)}">${esc(caption)}</text>`;
  });
  return s;
}

// The land, as rough outlines in longitude and latitude: enough to tell where a story happened.
const LAND = [
  // North America
  [[-168, 66], [-162, 70], [-140, 70], [-125, 70], [-95, 72], [-80, 73], [-62, 66], [-55, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-82, 28], [-84, 30], [-90, 29], [-97, 27], [-97, 22], [-92, 18], [-87, 21], [-88, 15], [-83, 10], [-79, 9], [-81, 8], [-86, 12], [-92, 14], [-105, 20], [-110, 24], [-112, 30], [-117, 33], [-124, 40], [-124, 48], [-130, 55], [-140, 60], [-152, 58], [-165, 60]],
  // Greenland and Iceland
  [[-55, 60], [-42, 60], [-20, 70], [-18, 80], [-40, 83], [-65, 80], [-70, 77], [-58, 75], [-52, 68]],
  [[-24, 64], [-14, 64], [-14, 66], [-22, 66.5]],
  // South America
  [[-80, 9], [-72, 12], [-62, 11], [-52, 5], [-50, 0], [-35, -5], [-35, -9], [-39, -15], [-41, -22], [-48, -26], [-53, -33], [-58, -38], [-62, -40], [-65, -45], [-68, -52], [-72, -50], [-74, -44], [-73, -37], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0], [-78, 3], [-77, 8]],
  // Europe and Asia
  [[-10, 36], [-9, 43], [-2, 44], [-4, 48], [2, 51], [5, 53], [8, 57], [5, 59], [5, 62], [12, 66], [18, 70], [28, 71], [40, 67], [45, 68], [60, 69], [70, 73], [80, 73], [100, 77], [115, 73], [130, 71], [140, 72], [160, 70], [170, 70], [180, 68], [180, 65], [170, 60], [163, 58], [156, 51], [156, 57], [148, 59], [140, 54], [135, 43], [129, 35], [127, 38], [126, 35], [120, 40], [122, 30], [119, 25], [110, 21], [108, 17], [109, 12], [105, 9], [103, 1], [100, 6], [99, 13], [98, 16], [94, 17], [92, 22], [88, 22], [86, 20], [80, 15], [78, 8], [73, 17], [72, 21], [67, 25], [61, 25], [57, 26], [56, 24], [59, 22], [55, 17], [44, 12], [43, 15], [39, 22], [35, 28], [34, 31], [36, 35], [30, 36], [27, 37], [26, 40], [23, 40], [23, 37], [21, 38], [19, 42], [13, 45], [13, 42], [16, 40], [18, 40], [16, 38], [12, 42], [8, 44], [3, 43], [3, 42], [-1, 37], [-5, 36]],
  // Britain, Ireland, Japan
  [[-5, 50], [1, 51], [2, 53], [-2, 56], [-3, 58], [-6, 58], [-5, 55], [-3, 54], [-5, 52]],
  [[-10, 52], [-6, 52], [-6, 55], [-8, 55], [-10, 54]],
  [[130, 31], [132, 34], [135, 34], [140, 35], [141, 38], [142, 42], [145, 44], [141, 45], [140, 41], [139, 38], [136, 36], [132, 35], [130, 33]],
  // Africa and Madagascar
  [[-17, 21], [-17, 15], [-12, 8], [-8, 4], [-2, 5], [5, 6], [9, 4], [10, -2], [12, -6], [13, -12], [12, -18], [15, -27], [18, -34], [20, -35], [26, -34], [32, -29], [35, -24], [35, -18], [40, -15], [40, -10], [39, -5], [42, 0], [48, 5], [51, 11], [44, 11], [43, 12], [39, 17], [37, 22], [35, 28], [33, 31], [30, 31], [25, 32], [20, 31], [15, 32], [10, 34], [11, 37], [3, 37], [-2, 35], [-6, 36], [-10, 30], [-13, 27]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  // South-East Asia's islands
  [[95, 5], [98, 4], [104, -2], [106, -6], [102, -4], [97, 1]],
  [[105, -6], [114, -7], [114, -8.5], [106, -7.5]],
  [[109, 2], [114, 4], [117, 7], [119, 5], [117, 1], [116, -4], [111, -3], [109, -1]],
  [[120, 18], [122, 18], [124, 12], [126, 7], [122, 7], [121, 13]],
  [[131, -1], [138, -2], [146, -6], [150, -10], [143, -9], [138, -8], [132, -4]],
  // Australia and New Zealand
  [[114, -22], [114, -30], [115, -34], [118, -35], [124, -33], [130, -31], [135, -35], [138, -35], [141, -38], [147, -38], [150, -37], [153, -31], [153, -25], [146, -19], [145, -15], [142, -11], [141, -17], [136, -15], [137, -12], [132, -11], [129, -15], [125, -14], [122, -18]],
  [[172, -34], [175, -37], [178, -38], [176, -41], [172, -44], [167, -46], [170, -46], [174, -41], [173, -39]],
];
// Hudson Bay, drawn back in as water.
const BAY = [[-95, 58], [-88, 56], [-80, 52], [-78, 58], [-77, 62], [-88, 64], [-94, 61]];

// The map: every illustrated story as a numbered pin in its region's colour, every brief as a dot.
function map(x, y, w, h) {
  const LON0 = -166, LON1 = 180, LAT0 = 74, LAT1 = -50;
  const k = Math.min(w / (LON1 - LON0), (h - 22) / (LAT0 - LAT1));
  const ox = x + (w - k * (LON1 - LON0)) / 2, oy = y + 22 + (h - 22 - k * (LAT0 - LAT1)) / 2;
  const px = ([lon, lat]) => [n(ox + (lon - LON0) * k), n(oy + (LAT0 - lat) * k)];
  const path = (pts) => 'M ' + pts.map((p) => px(p).join(',')).join(' L ') + ' Z';
  let s = `<defs><clipPath id="c-map"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/></clipPath></defs>`;
  s += `<g clip-path="url(#c-map)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#16294a"/>`;
  s += `<path d="${LAND.map(path).join(' ')}" fill="#d9cfb6"/><path d="${path(BAY)}" fill="#16294a"/>`;
  for (const b of BRIEFS) {
    const [cx, cy] = px(b[3]);
    s += `<circle cx="${cx}" cy="${cy}" r="3" fill="${REGIONS[b[0]].color}" stroke="#ffffff" stroke-width="1"/>`;
  }
  // Pins are drawn from the last story to the first, so the lead sits on top where pins crowd.
  for (let i = STORIES.length - 1; i >= 0; i--) {
    const [cx, cy] = px(STORIES[i].at);
    s += badge(cx, cy, 8, i + 1, REGIONS[STORIES[i].region].color, 11);
  }
  s += `</g>`;
  s += `<text x="${x + 8}" y="${y + 16}" ${HEAD_FONT} font-size="15" letter-spacing="1.5" fill="#f2c14e">WHERE IT HAPPENED</text>`;
  s += `<text x="${x + w - 8}" y="${y + 16}" text-anchor="end" ${FONT} font-weight="600" font-size="12.5" fill="#cbd5e1">pins 1–${STORIES.length} · dots: briefs</text>`;
  return s;
}

// The briefs run down two columns beside the map: a number, the place, then the news.
function briefs(x, y, w, h) {
  const colGap = 14, colW = (w - colGap) / 2, perCol = Math.ceil(BRIEFS.length / 2);
  const step = Math.min(16, (h - 38) / (perCol - 1));
  const size = step < 15 ? 14 : 15;
  let s = `<text x="${x}" y="${y + 13}" ${HEAD_FONT} font-size="16" letter-spacing="1.5" fill="#0f1b33">ALSO ON ${DAY}</text>`;
  s += `<text x="${x + w}" y="${y + 13}" text-anchor="end" ${HEAD_FONT} font-size="13.5" letter-spacing="0.8" fill="#475569">${BRIEFS.length} MORE STORIES</text>`;
  s += `<rect x="${x}" y="${y + 18}" width="${w}" height="2" fill="#0f1b33"/>`;
  BRIEFS.forEach(([region, place, text], i) => {
    const cx = x + Math.floor(i / perCol) * (colW + colGap);
    const lineY = n(y + 34 + (i % perCol) * step);
    const color = REGIONS[region].color;
    s += `<text x="${n(cx + 17)}" y="${lineY}" text-anchor="end" ${HEAD_FONT} font-size="12.5" fill="#64748b">${STORIES.length + i + 1}</text>`;
    s += `<text x="${n(cx + 22)}" y="${lineY}" ${FONT} font-size="${size}" data-fit="${n(colW - 22)}">`
      + `<tspan font-weight="700" fill="${color}">${esc(place)}</tspan><tspan font-weight="600" fill="#111827"> ${esc(text)}</tspan></text>`;
  });
  return s;
}

// What was left off on purpose, because it broke on another day.
function dateCheck(y, h) {
  let s = `<rect x="${MARGIN}" y="${y}" width="${SIZE - 2 * MARGIN}" height="${h}" rx="4" fill="#fbf8f1" stroke="#b3261e" stroke-width="1.5"/>`;
  s += `<text x="${MARGIN + 8}" y="${y + h - 6}" ${FONT} font-size="13.5" data-fit="${SIZE - 2 * MARGIN - 16}">`
    + `<tspan font-weight="700" fill="#b3261e" letter-spacing="1">DATE CHECK</tspan><tspan font-weight="600" fill="#3f4a5a"> — ${esc(DATE_CHECK)}</tspan></text>`;
  return s;
}

function page() {
  const colX = (c) => MARGIN + c * (COL_W + GAP);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">`;
  s += `<rect width="${SIZE}" height="${SIZE}" fill="#e9e3d5"/>`;

  // Header: the day this picture sums up.
  s += `<rect width="${SIZE}" height="104" fill="#0f1b33"/>`;
  s += `<text x="${MARGIN + 2}" y="20" ${HEAD_FONT} font-size="17" letter-spacing="3" fill="#f2c14e">THE WORLD'S NEWS IN ONE PICTURE</text>`;
  s += `<text x="${SIZE - MARGIN - 2}" y="20" text-anchor="end" ${HEAD_FONT} font-size="17" letter-spacing="3" fill="#f2c14e">${TOTAL} STORIES · ${Object.keys(REGIONS).length} REGIONS · ONE DAY</text>`;
  s += `<text x="${SIZE / 2}" y="75" text-anchor="middle" ${HEAD_FONT} font-size="61" letter-spacing="1" fill="#ffffff" data-fit="${SIZE - 40}">${DAY}</text>`;
  s += `<text x="${SIZE / 2}" y="97" text-anchor="middle" ${FONT} font-weight="600" font-style="italic" font-size="17" fill="#f6e7bd" data-fit="${SIZE - 32}">${esc(STRAPLINE)}</text>`;
  s += regionBar(104, 20);
  s += numbers(127, 40);

  // The lead takes two columns of the first row; the other stories fill the grid in order.
  const slots = [[0, 0, 2], [2, 0, 1], [3, 0, 1], [0, 1, 1], [1, 1, 1], [2, 1, 1], [3, 1, 1], [0, 2, 1], [1, 2, 1], [2, 2, 1], [3, 2, 1]];
  STORIES.forEach((story, i) => {
    const [c, r, span] = slots[i];
    s += card(story, colX(c), ROWS[r].y, COL_W * span + GAP * (span - 1), ROWS[r].h, i);
  });

  // Below the grid: the map on the left, the briefs beside it, then the date check.
  const MAP_W = 330;
  s += map(MARGIN, 797, MAP_W, 182);
  s += briefs(MARGIN + MAP_W + 12, 797, SIZE - 2 * MARGIN - MAP_W - 12, 182);
  s += dateCheck(983, 19);

  // Footer: how the page was put together.
  s += `<rect y="${SIZE - 20}" width="${SIZE}" height="20" fill="#0f1b33"/>`;
  s += `<text x="${SIZE / 2}" y="${SIZE - 5.5}" text-anchor="middle" ${FONT} font-weight="600" font-size="13.5" letter-spacing="0.3" fill="#e2e8f0" data-fit="${SIZE - 20}">${esc(FOOTER)}</text>`;
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
