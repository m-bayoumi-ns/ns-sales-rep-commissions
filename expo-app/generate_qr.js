const { toQR } = require('./node_modules/toqr');
const fs = require('fs');
const path = require('path');

const url = 'exp://192.168.1.15:8081';
const matrix = toQR(url);
const size = 25; // 25x25 grid
const margin = 2;
const totalSize = size + (margin * 2);

let rects = '';
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    if (matrix[y * size + x] === 1) {
      rects += `<rect x="${x + margin}" y="${y + margin}" width="1" height="1" fill="#12100E"/>`;
    }
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="220" height="220" shape-rendering="crispEdges">
  <rect width="${totalSize}" height="${totalSize}" fill="#FFFFFF" rx="2"/>
  ${rects}
</svg>`;

const outPath = path.join(__dirname, 'assets', 'expo-qr.svg');
fs.writeFileSync(outPath, svg);
console.log('Successfully written SVG QR to', outPath);
