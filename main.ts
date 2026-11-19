// One image that sums up the world's news of Thursday 19 November 2026.
// The picture is drawn by tools/make-image.mjs and committed as entry.png;
// this program hands it to the grader unchanged (no network, standard library only).

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1048576; // the gate's limit: 1 MiB
const MAX_SIDE = 1024; // and 1024 by 1024 pixels
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const image = readFileSync(new URL('./entry.png', import.meta.url));

// Refuse to hand over a picture the gate would turn away: say why instead of scoring 0 silently.
if (!image.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('entry.png is not a PNG file');
if (image.length > MAX_BYTES) throw new Error(`entry.png is ${image.length} bytes, over ${MAX_BYTES}`);
const width = image.readUInt32BE(16); // the IHDR chunk opens every PNG: width, then height
const height = image.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) throw new Error(`entry.png is ${width}x${height}, over ${MAX_SIDE}`);

// The same bytes on every run: the picture is copied as it is, never redrawn.
writeFileSync(join(outputDir, 'entry.png'), image);
console.log(`wrote entry.png: ${width}x${height}, ${image.length} bytes`);
