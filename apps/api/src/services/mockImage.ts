import sharp from "sharp";

/**
 * Generates a pixel-art heart image at exactly `gridSize` × `gridSize`.
 * Each pixel maps 1:1 to a perler bead — no scaling.
 * When gridSize === 30 we use a hand-tuned row-drawn heart for maximum clarity;
 * otherwise a math-formula heart is rendered.
 */
export async function generateMockImage(gridSize: number = 30): Promise<Buffer> {
  if (gridSize === 30) {
    return drawHeart30();
  }
  return drawHeartMath(gridSize);
}

/* ── 30×30 hand-tuned heart ── */
function drawHeart30(): Promise<Buffer> {
  const size = 30;

  // 0 = light-pink bg, 1 = red, 2 = pink highlight, 3 = dark-red shadow, 4 = white sparkle
  const palette: [number, number, number][] = [
    [255, 228, 225], // #FFE4E1 bg (not pure white, so pipeline doesn't confuse it with heart white)
    [231, 76, 60],   // #E74C3C red
    [255, 153, 153], // #FF9999 pink
    [192, 57, 43],   // #C0392B dark red
    [255, 255, 255], // #FFFFFF white sparkle
  ];

  const pixels: number[] = new Array(size * size).fill(0);

  function setPixel(x: number, y: number, color: number) {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      pixels[y * size + x] = color;
    }
  }

  function fillRow(y: number, x1: number, x2: number, color: number) {
    for (let x = x1; x <= x2; x++) setPixel(x, y, color);
  }

  // Dark-red outline (top lobes)
  fillRow(3, 7, 10, 3);  fillRow(3, 19, 22, 3);
  fillRow(4, 5, 12, 3);  fillRow(4, 17, 24, 3);

  // Red body
  fillRow(5, 4, 13, 1);  fillRow(5, 16, 25, 1);
  fillRow(6, 3, 14, 1);  fillRow(6, 15, 26, 1);
  fillRow(7, 3, 14, 1);  fillRow(7, 15, 26, 1);
  fillRow(8, 2, 27, 1);
  fillRow(9, 2, 27, 1);
  fillRow(10, 2, 27, 1);
  fillRow(11, 3, 26, 1);
  fillRow(12, 3, 26, 1);
  fillRow(13, 4, 25, 1);
  fillRow(14, 4, 25, 1);
  fillRow(15, 5, 24, 1);
  fillRow(16, 6, 23, 1);
  fillRow(17, 7, 22, 1);
  fillRow(18, 8, 21, 1);
  fillRow(19, 9, 20, 1);
  fillRow(20, 10, 19, 1);
  fillRow(21, 11, 18, 1);
  fillRow(22, 12, 17, 1);
  fillRow(23, 13, 16, 1);
  fillRow(24, 14, 15, 1);

  // Pink highlight zones (upper-left of each lobe, larger areas)
  fillRow(5, 5, 7, 2);   fillRow(5, 22, 24, 2);
  fillRow(6, 4, 8, 2);   fillRow(6, 21, 25, 2);
  fillRow(7, 4, 7, 2);   fillRow(7, 22, 25, 2);
  fillRow(8, 3, 6, 2);   fillRow(8, 23, 26, 2);
  setPixel(4, 6, 2);     setPixel(25, 6, 2);

  // White sparkles (eye-catchers)
  setPixel(4, 5, 4); setPixel(3, 6, 4); setPixel(4, 7, 4);
  setPixel(25, 5, 4); setPixel(26, 6, 4); setPixel(25, 7, 4);
  setPixel(14, 8, 4); setPixel(15, 8, 4);

  // Dark-red shadows (bottom centre + right lobe lower edge)
  fillRow(17, 10, 12, 3); fillRow(17, 17, 19, 3);
  fillRow(18, 9, 13, 3);  fillRow(18, 16, 20, 3);
  fillRow(19, 9, 12, 3);  fillRow(19, 17, 20, 3);
  fillRow(20, 10, 12, 3); fillRow(20, 17, 19, 3);
  fillRow(21, 11, 12, 3); fillRow(21, 17, 18, 3);

  // Subtle dark outline along lower-right edge for depth
  setPixel(21, 18, 3); setPixel(20, 19, 3); setPixel(19, 20, 3);
  setPixel(18, 21, 3); setPixel(17, 21, 3); setPixel(16, 22, 3);
  setPixel(15, 23, 3); setPixel(14, 24, 3);

  return encodePixels(pixels, palette, size);
}

/* ── Math-formula heart (any gridSize) ── */
function drawHeartMath(size: number): Promise<Buffer> {
  const raw = Buffer.alloc(size * size * 4);

  const RED: [number, number, number] = [231, 76, 60];
  const PINK: [number, number, number] = [255, 153, 153];
  const DARK: [number, number, number] = [192, 57, 43];
  const WHITE: [number, number, number] = [255, 255, 255];
  const BG: [number, number, number] = [255, 228, 225];

  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const scale = size / 2.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x - cx) / scale;
      const ny = (cy - y) / scale;
      const heartVal =
        Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * Math.pow(ny, 3);

      let color: [number, number, number];
      if (heartVal < 0) {
        if (nx < -0.15 && ny > 0.25) color = PINK;
        else if (nx > 0.25 && ny < -0.2) color = DARK;
        else if (nx < -0.35 && ny > 0.45) color = WHITE;
        else color = RED;
      } else {
        color = BG;
      }

      const idx = (y * size + x) * 4;
      raw[idx] = color[0];
      raw[idx + 1] = color[1];
      raw[idx + 2] = color[2];
      raw[idx + 3] = 255;
    }
  }

  return sharp(raw, {
    raw: { width: size, height: size, channels: 4 },
  })
    .png()
    .toBuffer();
}

/* ── helper ── */
function encodePixels(
  pixels: number[],
  palette: [number, number, number][],
  size: number
): Promise<Buffer> {
  const raw = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = palette[pixels[y * size + x]];
      const idx = (y * size + x) * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = 255;
    }
  }
  return sharp(raw, {
    raw: { width: size, height: size, channels: 4 },
  })
    .png()
    .toBuffer();
}
