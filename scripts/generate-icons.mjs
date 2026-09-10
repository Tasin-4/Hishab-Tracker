import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function writePNG(width, height, getPixel, outputPath) {
  // RGBA 8-bit per channel
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const makeChunk = (type, data) => {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  };

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outputPath, pngBuffer);
}

// Ensure public dir
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Icon design:
// Deep sleek indigo/slate background (#131722), rounded square badge with subtle glowing accent
// In the center, stylized Bengali 'হ' or ledger glyph (balance scales / notebook in crisp white + teal/rust dots)
function drawIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const margin = isMaskable ? w * 0.15 : w * 0.05;
  const size = w - margin * 2;
  const cornerR = isMaskable ? 0 : w * 0.22; // rounded for normal, full-bleed for maskable

  // Background is dark ink #131722
  let inBg = false;
  if (isMaskable) {
    inBg = true;
  } else {
    // Rounded rect check
    const rx = Math.max(0, Math.abs(x - cx) - (w / 2 - cornerR));
    const ry = Math.max(0, Math.abs(y - cy) - (h / 2 - cornerR));
    if (rx * rx + ry * ry <= cornerR * cornerR) {
      inBg = true;
    }
  }

  if (!inBg) return [0, 0, 0, 0];

  // Base background gradient: #141824 to #22293d
  const t = (y / h);
  let bgR = Math.round(20 + t * 15);
  let bgG = Math.round(24 + t * 20);
  let bgB = Math.round(36 + t * 30);

  // Draw central ledger icon inside safe box:
  // Card at center:
  const cardW = w * (isMaskable ? 0.46 : 0.52);
  const cardH = h * (isMaskable ? 0.54 : 0.60);
  const cardX1 = cx - cardW / 2;
  const cardX2 = cx + cardW / 2;
  const cardY1 = cy - cardH / 2;
  const cardY2 = cy + cardH / 2;
  const cardR = w * 0.06;

  // Check if inside card
  const cdx = Math.max(0, Math.abs(x - cx) - (cardW / 2 - cardR));
  const cdy = Math.max(0, Math.abs(y - cy) - (cardH / 2 - cardR));
  const insideCard = (cdx * cdx + cdy * cdy <= cardR * cardR);

  if (insideCard) {
    // Card header bar (accent blue #3151e0)
    if (y < cardY1 + cardH * 0.28) {
      return [49, 81, 224, 255]; // accent blue
    }
    // Card body (clean white #ffffff)
    // Draw lines inside card:
    const relY = y - (cardY1 + cardH * 0.28);
    const bodyH = cardH * 0.72;

    // Line 1 (teal dot + line)
    if (relY > bodyH * 0.2 && relY < bodyH * 0.35) {
      if (x > cardX1 + cardW * 0.18 && x < cardX1 + cardW * 0.30) {
        return [15, 157, 116, 255]; // teal dot
      }
      if (x > cardX1 + cardW * 0.36 && x < cardX2 - cardW * 0.18) {
        return [180, 190, 205, 255]; // line
      }
    }
    // Line 2 (rust dot + line)
    if (relY > bodyH * 0.5 && relY < bodyH * 0.65) {
      if (x > cardX1 + cardW * 0.18 && x < cardX1 + cardW * 0.30) {
        return [224, 98, 63, 255]; // rust dot
      }
      if (x > cardX1 + cardW * 0.36 && x < cardX2 - cardW * 0.18) {
        return [180, 190, 205, 255]; // line
      }
    }

    return [255, 255, 255, 255];
  }

  // Accent ring / glowing edge around card
  const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
  if (dist > w * 0.36 && dist < w * 0.38) {
    return [49, 81, 224, 180];
  }

  return [bgR, bgG, bgB, 255];
}

console.log('Generating PWA icons...');
writePNG(192, 192, (x, y, w, h) => drawIcon(x, y, w, h, false), path.join(publicDir, 'pwa-192x192.png'));
writePNG(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, false), path.join(publicDir, 'pwa-512x512.png'));
writePNG(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, true), path.join(publicDir, 'pwa-maskable-512x512.png'));
writePNG(180, 180, (x, y, w, h) => drawIcon(x, y, w, h, false), path.join(publicDir, 'apple-touch-icon.png'));
writePNG(64, 64, (x, y, w, h) => drawIcon(x, y, w, h, false), path.join(publicDir, 'favicon.ico'));

// Also write public/icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="115" fill="#131722"/>
  <circle cx="256" cy="256" r="190" stroke="#3151E0" stroke-width="6" opacity="0.4"/>
  <rect x="136" y="116" width="240" height="280" rx="28" fill="#FFFFFF" filter="drop-shadow(0 12px 24px rgba(0,0,0,0.3))"/>
  <path d="M136 144 C136 128.536 148.536 116 164 116 H348 C363.464 116 376 128.536 376 144 V188 H136 V144 Z" fill="#3151E0"/>
  <circle cx="180" cy="152" r="8" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="204" cy="152" r="8" fill="#FFFFFF" opacity="0.8"/>
  <rect x="168" y="224" width="24" height="24" rx="6" fill="#0F9D74"/>
  <rect x="208" y="230" width="136" height="12" rx="6" fill="#B0B9C7"/>
  <rect x="168" y="274" width="24" height="24" rx="6" fill="#E0623F"/>
  <rect x="208" y="280" width="136" height="12" rx="6" fill="#B0B9C7"/>
  <rect x="168" y="324" width="24" height="24" rx="6" fill="#3151E0"/>
  <rect x="208" y="330" width="90" height="12" rx="6" fill="#B0B9C7"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);

console.log('All icons generated successfully!');
