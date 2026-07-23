import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to generate raw PNG with solid color & text placeholder in node
function createSolidPng(width, height, r = 16, g = 185, b = 129) {
  // Uncompressed RGBA image data
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Border radius effect / circle accent in middle
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < width * 0.35) {
        // Darker emerald inner circle accent
        rawData[pxOffset] = 15;     // R
        rawData[pxOffset + 1] = 23;  // G
        rawData[pxOffset + 2] = 42;  // B
        rawData[pxOffset + 3] = 255; // A
      } else {
        rawData[pxOffset] = r;     // R
        rawData[pxOffset + 1] = g; // G
        rawData[pxOffset + 2] = b; // B
        rawData[pxOffset + 3] = 255; // A
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = -1;
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
    }
    return (c ^ -1) >>> 0;
  }

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); // PNG signature
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Generate SVGs
function createSvgIcon(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="${Math.floor(width*0.22)}" fill="#10B981"/>
    <rect x="${Math.floor(width*0.1)}" y="${Math.floor(width*0.1)}" width="${Math.floor(width*0.8)}" height="${Math.floor(width*0.8)}" rx="${Math.floor(width*0.18)}" fill="#0F172A" opacity="0.25"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.floor(width*0.45)}" font-weight="900" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">💰</text>
  </svg>`;
}

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createSolidPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createSolidPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), createSvgIcon(192, 192));
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), createSvgIcon(512, 512));

const manifest = {
  name: "FinanzasClaras",
  short_name: "Finanzas",
  description: "Gestor de Gastos y Presupuesto Personal",
  start_url: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#0F172A",
  theme_color: "#10B981",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-192.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any maskable"
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('PWA Assets successfully created in /public');
