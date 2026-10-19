import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Funções para gerar arquivos PNG válidos sem dependências externas
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const c = crc32(typeAndData);
  chunk.writeUInt32BE(c, 8 + len);
  return chunk;
}

function createPNG(width, height, getPixel) {
  // getPixel(x, y) => [r, g, b, a] (0-255)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a !== undefined ? a : 255;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const assetsDir = path.resolve('public', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1. bg_sky.png (800x450 gradient sky with soft clouds and stars/sunset)
console.log('Generating bg_sky.png...');
const skyPNG = createPNG(800, 450, (x, y) => {
  const t = y / 450;
  // Beautiful deep blue twilight gradient
  const r = Math.floor(18 * (1 - t) + 40 * t);
  const g = Math.floor(28 * (1 - t) + 65 * t);
  const b = Math.floor(65 * (1 - t) + 115 * t);
  
  // Stars in upper sky
  const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  const isStar = (y < 260) && (Math.abs(hash - Math.floor(hash)) > 0.992);
  if (isStar) {
    return [255, 255, 255, 220];
  }

  // Moon
  const dx = x - 680;
  const dy = y - 80;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 32) {
    // Moon body
    const cDist = Math.sqrt((dx - 10) ** 2 + (dy - 6) ** 2);
    if (cDist < 26) {
      return [255, 255, 235, 255];
    }
    return [245, 240, 210, 240];
  } else if (dist < 45) {
    const alpha = Math.floor((1 - (dist - 32) / 13) * 60);
    return [230, 240, 255, alpha];
  }

  return [r, g, b, 255];
});
fs.writeFileSync(path.join(assetsDir, 'bg_sky.png'), skyPNG);

// 2. bg_city.png (800x450 parallax city skyline with buildings & windows)
console.log('Generating bg_city.png...');
// Generate deterministic building heights
const buildings = [];
let curX = 0;
let seed = 42;
function rng() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
while (curX < 800) {
  const w = Math.floor(rng() * 40 + 35);
  const h = Math.floor(rng() * 160 + 130);
  buildings.push({ x: curX, w, h });
  curX += w - 2;
}

const cityPNG = createPNG(800, 450, (x, y) => {
  // Check buildings
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    if (x >= b.x && x < b.x + b.w) {
      const top = 450 - b.h;
      if (y >= top) {
        // Antenna on some buildings
        const isAntenna = (x === b.x + Math.floor(b.w / 2)) && y < top && y >= top - 25;
        if (isAntenna) return [70, 85, 120, 255];

        // Building edge highlight
        if (x === b.x || x === b.x + b.w - 1 || y === top) {
          return [45, 60, 95, 255];
        }

        // Lit windows
        const winX = (x - b.x) % 12;
        const winY = (y - top) % 16;
        if (winX >= 3 && winX <= 7 && winY >= 5 && winY <= 11) {
          const winSeed = Math.sin(Math.floor(x / 12) * 53 + Math.floor(y / 16) * 97);
          if (winSeed > 0.1) {
            return [254, 240, 138, 220]; // warm light
          } else if (winSeed < -0.4) {
            return [147, 197, 253, 190]; // bluish light
          }
        }
        return [30, 41, 68, 240];
      }
    }
  }
  return [0, 0, 0, 0]; // Transparent
});
fs.writeFileSync(path.join(assetsDir, 'bg_city.png'), cityPNG);

// 3. tile_ground.png (48x48 platform/ground tile)
console.log('Generating tile_ground.png...');
const groundPNG = createPNG(48, 48, (x, y) => {
  // Top grass / metal ledge (0-6)
  if (y < 4) {
    return [59, 130, 246, 255]; // Bright blue high-tech edge
  }
  if (y < 8) {
    return [37, 99, 235, 255]; // Deep blue lip
  }
  // Bevel line
  if (y === 8) {
    return [30, 58, 138, 255];
  }
  // Ground body: futuristic urban pavement pattern
  const isBorder = (x === 0 || x === 47 || y === 47);
  if (isBorder) {
    return [15, 23, 42, 255];
  }
  const isGrid = (x % 24 === 0) || ((y - 8) % 20 === 0);
  if (isGrid) {
    return [30, 41, 59, 255];
  }
  // Subtle texture
  const noise = (x * 7 + y * 13) % 5;
  const base = 48 + noise * 4;
  return [base, base + 6, base + 16, 255];
});
fs.writeFileSync(path.join(assetsDir, 'tile_ground.png'), groundPNG);

// Helper for drawing pixel art character into buffer
function drawPixelArt(pixels, palette, charMap) {
  // charMap is array of strings
  const h = charMap.length;
  const w = charMap[0].length;
  return createPNG(w, h, (x, y) => {
    const ch = charMap[y][x];
    const col = palette[ch];
    return col || [0, 0, 0, 0];
  });
}

// Paleta da Nina:
// '.' = transparente
// 'B' = contorno escuro [15, 23, 42, 255]
// 'H' = cabelo castanho escuro / vinho [136, 19, 55, 255]
// 'S' = pele clara [254, 215, 170, 255]
// 'E' = olhos [30, 41, 59, 255]
// 'W' = jaleco/camisa branca médica [248, 250, 252, 255]
// 'C' = cruz azul no jaleco [37, 99, 235, 255]
// 'P' = calça azul escuro [30, 58, 138, 255]
// 'F' = sapatos [51, 65, 85, 255]
// 'R' = vermelho hit / efeito [239, 68, 68, 255]
// 'Y' = faísca ataque [250, 204, 21, 255]
// 'L' = brilho [255, 255, 255, 255]

const paletteNina = {
  '.': [0, 0, 0, 0],
  'B': [15, 23, 42, 255],
  'H': [140, 25, 60, 255],
  'h': [190, 40, 80, 255], // highlight cabelo
  'S': [254, 215, 170, 255],
  's': [251, 191, 136, 255], // sombra pele
  'E': [15, 23, 42, 255],
  'W': [248, 250, 252, 255],
  'w': [203, 213, 225, 255], // sombra jaleco
  'C': [37, 99, 235, 255], // cruz / cinto azul
  'P': [30, 58, 138, 255],
  'F': [51, 65, 85, 255],
  'R': [239, 68, 68, 255],
  'Y': [250, 204, 21, 255],
  'L': [255, 255, 255, 255]
};

// 4. nina_idle.png (32x40)
console.log('Generating nina_idle.png...');
const ninaIdleMap = [
  "..........BBBBBB..........",
  "........BBHHHHHHBB........",
  ".......BHHHhhhhHHHB.......",
  "......BHHhhhhhhHHHHB......",
  "......BHHHHHHHHHHHHB......",
  "......BHHSSSSSSSSHHB......",
  "......BHHSEESSEESHHB......",
  "......BHHSSSSSSSSHHB......",
  "......BHHSSsSSsSSHHB......",
  ".......BSSSSSSSSSSB.......",
  ".......BHHSSSSSSHHB.......",
  "........BBWWCCWWBB........",
  ".......BWWWWCCWWWWBB......",
  "......BWWWWCCCCWWWWWB.....",
  "......BWWWWLCCLWWWWWB.....",
  ".....BWWWWWWCCWWWWWWWB....",
  ".....BWWWWWWCCWWWWWWWB....",
  ".....BWWWWwwwwwwWWWWWB....",
  ".....BSSWWwwwwwwWWSSWB....",
  ".....BB.WWWWWWWWWW.BB.....",
  "........BPPPPPPPPB........",
  "........BPPPPPPPPB........",
  "........BPPPPPPPPB........",
  "........BPPP..PPPB........",
  "........BPPP..PPPB........",
  "........BPPP..PPPB........",
  "........BPPP..PPPB........",
  "........BFFF..FFFB........",
  "........BFFF..FFFB........",
  ".......BBBBB..BBBBB......."
];
fs.writeFileSync(path.join(assetsDir, 'nina_idle.png'), drawPixelArt(null, paletteNina, ninaIdleMap));

// 5. nina_jump.png (32x40)
console.log('Generating nina_jump.png...');
const ninaJumpMap = [
  "..........BBBBBB..........",
  "........BBHHHHHHBB........",
  ".......BHHHhhhhHHHB.......",
  "......BHHhhhhhhHHHHB......",
  "......BHHSSSSSSSSHHB......",
  "......BHHSEESSEESHHB......",
  "......BHHSSSSSSSSHHB......",
  ".......BSSSSSSSSSSB.......",
  "......BBWWWWCCWWWWBB......",
  ".....BWWWWWWCCWWWWWWWB....",
  "....BSSWWWWWCCWWWWWSSB....",
  "....BSBWWWWWCCWWWWWBsB....",
  ".....B.WWWWwwwwwwW.B......",
  ".......BPPPPPPPPB.........",
  ".......BPPPPPPPPB.........",
  "......BPPPP..PPPPB........",
  ".....BPPPPB..BPPPPB.......",
  ".....BFFFB....BFFFB.......",
  ".....BBBBB....BBBBB.......",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  ".........................."
];
fs.writeFileSync(path.join(assetsDir, 'nina_jump.png'), drawPixelArt(null, paletteNina, ninaJumpMap));

// 6. nina_hit.png (32x40)
console.log('Generating nina_hit.png...');
const ninaHitMap = [
  "..........RRRRRR..........",
  "........RRHHHHHHRR........",
  ".......RHHHRRRRHHHR.......",
  "......RHHrrrrrrHHHHR......",
  "......RHHSSSSSSSSHHB......",
  "......RHHSXXSSXXSHHB......",
  "......RHHSSSSSSSSHHB......",
  ".......RSSSSSSSSSSB.......",
  "........RRWWCCWWRR........",
  ".......RWWWWCCWWWWRR......",
  "......RWWWWCCCCWWWWWR.....",
  ".....RWWWWWWCCWWWWWWWR....",
  ".....RSSWWwwwwwwWWSSWR....",
  ".....RR.WWWWWWWWWW.RR.....",
  "........RPPPPPPPPR........",
  "........RPPPPPPPPR........",
  "........RPPP..PPPR........",
  "........RPPP..PPPR........",
  "........RFFF..FFFR........",
  ".......RRRRR..RRRRR.......",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  ".........................."
].map(row => row.replace(/X/g, 'R'));
fs.writeFileSync(path.join(assetsDir, 'nina_hit.png'), drawPixelArt(null, paletteNina, ninaHitMap));

// 7. nina_attack.png (36x40 - swing pose with syringe/energy slash)
console.log('Generating nina_attack.png...');
const ninaAttackMap = [
  "..........BBBBBB..............",
  "........BBHHHHHHBB...YYL......",
  ".......BHHHhhhhHHHB..YYLL.....",
  "......BHHhhhhhhHHHHB.YYYLL....",
  "......BHHSSSSSSSSHHB..YYLL....",
  "......BHHSEESSEESHHB...YLL....",
  "......BHHSSSSSSSSHHB....YY....",
  ".......BSSSSSSSSSSB.....YY....",
  "......BBWWWWCCWWWWBB....YY....",
  ".....BWWWWWWCCWWWWWWBB..YY....",
  "....BWWWWWWWCCWWWWWWWSB.YY....",
  "...BWWWWWWWWCCWWWWWWWWSBY.....",
  "...BWWWWWWWWwwwwwwWWWWWY......",
  "....BBWWWWWWwwwwwwWWWWBYY.....",
  "......BPPPPPPPPPPPPPB..YYL....",
  "......BPPPPPPPPPPPPPB...YYLL..",
  ".....BPPPPB...BPPPPB.....YYL..",
  "....BPPPPB.....BPPPPB.........",
  "...BFFFFB.......BFFFFB........",
  "...BBBBBB.......BBBBBB........",
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  ".............................."
];
fs.writeFileSync(path.join(assetsDir, 'nina_attack.png'), drawPixelArt(null, paletteNina, ninaAttackMap));

// 8. nina_walk.png (4 frames side-by-side, 26x30 each = 104x30)
console.log('Generating nina_walk.png (4 frames)...');
const frame1 = [
  "..........BBBBBB..........",
  "........BBHHHHHHBB........",
  ".......BHHHhhhhHHHB.......",
  "......BHHhhhhhhHHHHB......",
  "......BHHSSSSSSSSHHB......",
  "......BHHSEESSEESHHB......",
  "......BHHSSSSSSSSHHB......",
  ".......BSSSSSSSSSSB.......",
  "........BBWWCCWWBB........",
  ".......BWWWWCCWWWWBB......",
  "......BWWWWCCCCWWWWWB.....",
  ".....BWWWWWWCCWWWWWWWB....",
  ".....BSSWWwwwwwwWWSSWB....",
  ".....BB.WWWWWWWWWW.BB.....",
  "........BPPPPPPPPB........",
  "........BPPPPPPPPB........",
  ".......BPPPP..PPPPB.......",
  ".......BPPPP..PPPPB.......",
  "......BPPPP....PPPPB......",
  "......BFFFB....BFFFB......",
  ".....BBBBB......BBBBB.....",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  ".........................."
];

const frame2 = [
  "..........BBBBBB..........",
  "........BBHHHHHHBB........",
  ".......BHHHhhhhHHHB.......",
  "......BHHhhhhhhHHHHB......",
  "......BHHSSSSSSSSHHB......",
  "......BHHSEESSEESHHB......",
  "......BHHSSSSSSSSHHB......",
  ".......BSSSSSSSSSSB.......",
  "........BBWWCCWWBB........",
  ".......BWWWWCCWWWWBB......",
  "......BWWWWCCCCWWWWWB.....",
  ".....BWWWWWWCCWWWWWWWB....",
  ".....BSSWWwwwwwwWWSSWB....",
  ".....BB.WWWWWWWWWW.BB.....",
  "........BPPPPPPPPB........",
  "........BPPPPPPPPB........",
  "........BPPPPPPPPB........",
  "........BPPP..PPPB........",
  "........BPPP..PPPB........",
  "........BFFF..FFFB........",
  ".......BBBBB..BBBBB.......",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  ".........................."
];

const frame3 = [
  "..........BBBBBB..........",
  "........BBHHHHHHBB........",
  ".......BHHHhhhhHHHB.......",
  "......BHHhhhhhhHHHHB......",
  "......BHHSSSSSSSSHHB......",
  "......BHHSEESSEESHHB......",
  "......BHHSSSSSSSSHHB......",
  ".......BSSSSSSSSSSB.......",
  "........BBWWCCWWBB........",
  ".......BWWWWCCWWWWBB......",
  "......BWWWWCCCCWWWWWB.....",
  ".....BWWWWWWCCWWWWWWWB....",
  ".....BSSWWwwwwwwWWSSWB....",
  ".....BB.WWWWWWWWWW.BB.....",
  "........BPPPPPPPPB........",
  "........BPPPPPPPPB........",
  ".......BPPPP..PPPPB.......",
  "......BPPPP....PPPPB......",
  ".....BPPPP......PPPPB.....",
  ".....BFFFB......BFFFB.....",
  "....BBBBB........BBBBB....",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  ".........................."
];

const frame4 = frame2;

const walkCombined = [];
for (let y = 0; y < 30; y++) {
  walkCombined.push(frame1[y] + frame2[y] + frame3[y] + frame4[y]);
}
fs.writeFileSync(path.join(assetsDir, 'nina_walk.png'), drawPixelArt(null, paletteNina, walkCombined));

// 9. enemy.png (32x32 patrolling virus/robot enemy)
console.log('Generating enemy.png...');
const paletteEnemy = {
  '.': [0, 0, 0, 0],
  'B': [24, 24, 27, 255],
  'R': [225, 29, 72, 255],
  'r': [159, 18, 57, 255],
  'Y': [250, 204, 21, 255],
  'E': [255, 255, 255, 255],
  'P': [15, 23, 42, 255],
  'S': [244, 63, 94, 255],
  'M': [71, 85, 105, 255]
};
const enemyMap = [
  "..........BBBBBBBB..........",
  ".......BBBBRRRRRRBBBB.......",
  "......BRRRRRRRRRRRRRRB......",
  ".....BRRRRRSSSSRRRRRRRB.....",
  "....BRRRSSSSSSSSRRRRRRRB....",
  "...BRRRSSSSSSSSSSRRRRRRRB...",
  "..BRRRSSSSSSSSSSSSRRRRRRRB..",
  "..BRRRSSBEEESSSBEEESRRRRRB..",
  "..BRRRSSBEEESSSBEEESRRRRRB..",
  "..BRRRSSBEPESSSBEPESRRRRRB..",
  ".BRRRRSSBEEESSSBEEESRRRRRRB.",
  ".BRRRRSSSSSSSSSSSSSSRRRRRRB.",
  ".BRRRRSSSRRRRRRRRSSSRRRRRRB.",
  ".BRRRRSSRYYYYYYYYRSSRRRRRRB.",
  ".BRRRRSSRYBBYBBYBRSSRRRRRRB.",
  ".BRRRRSSRYYYYYYYYRSSRRRRRRB.",
  ".BRRRRSSSRRRRRRRRSSSRRRRRRB.",
  ".BRRRRSSSSSSSSSSSSSSRRRRRRB.",
  "..BRRRSSSSSSSSSSSSRRRRRRRB..",
  "..BRRRSSSSSSSSSSSSRRRRRRRB..",
  "...BRRRSSSSSSSSSSRRRRRRRB...",
  "...BRRRRRSSSSRRRRRRRRRRB....",
  "....BRRRRRRRRRRRRRRRRRB.....",
  ".....BBBBBRRRRRRBBBBBB......",
  ".....BMMMBBB..BBBMMMBB......",
  "....BMMMMMB....BMMMMMB......",
  "....BMMMMMB....BMMMMMB......",
  "....BBBBBBB....BBBBBBB......"
];
fs.writeFileSync(path.join(assetsDir, 'enemy.png'), drawPixelArt(null, paletteEnemy, enemyMap));

// 10. remedy.png (28x28 glowing medicine bottle / capsule)
console.log('Generating remedy.png...');
const paletteRemedy = {
  '.': [0, 0, 0, 0],
  'B': [15, 23, 42, 255],
  'C': [6, 182, 212, 255],   // cyan cap
  'c': [8, 145, 178, 255],
  'W': [255, 255, 255, 255], // bottle glass / pills
  'w': [226, 232, 240, 255],
  'R': [239, 68, 68, 255],   // red cross
  'Y': [253, 224, 71, 255],  // glow
  'G': [56, 189, 248, 200]
};
const remedyMap = [
  ".........BBBBBBBB.........",
  "........BCCCCCCCCB........",
  "........BCCCCCCCCB........",
  "........BccccccccB........",
  ".......BBBBBBBBBBBB.......",
  "......BGGGGGGGGGGGGB......",
  ".....BGWWWWWWWWWWWWGB.....",
  "....BGWWWWWWWWWWWWWWGB....",
  "....BGWWWWRRRRRRWWWWGB....",
  "...BGWWWWWRRRRRRWWWWWGB...",
  "...BGWWWWWRRRRRRWWWWWGB...",
  "...BGWWWRRRRRRRRRRWWWGB...",
  "...BGWWWRRRRRRRRRRWWWGB...",
  "...BGWWWRRRRRRRRRRWWWGB...",
  "...BGWWWRRRRRRRRRRWWWGB...",
  "...BGWWWWWRRRRRRWWWWWGB...",
  "...BGWWWWWRRRRRRWWWWWGB...",
  "...BGWWWWRRRRRRWWWWGB....",
  "....BGWWWWWWWWWWWWWWGB....",
  "....BGWWWWWWWWWWWWWWGB....",
  ".....BGWWWWWWWWWWWWGB.....",
  "......BBBBBBBBBBBBBB......"
];
fs.writeFileSync(path.join(assetsDir, 'remedy.png'), drawPixelArt(null, paletteRemedy, remedyMap));

console.log('All assets successfully generated in public/assets!');
