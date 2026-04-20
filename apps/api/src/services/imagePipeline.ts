import sharp from "sharp";
import type { BeadData } from "@pixelwords/shared-types";

// Vibrant perler-bead palette (Hama/Perler inspired) — brighter, fewer muddy colors
const BEAD_PALETTE: [number, number, number][] = [
  [0xFF, 0xFF, 0xFF], // White
  [0x00, 0x00, 0x00], // Black
  [0xF4, 0xD0, 0x3F], // Yellow
  [0xFF, 0xA5, 0x00], // Bright Orange
  [0xE7, 0x4C, 0x3C], // Red
  [0xFF, 0x69, 0xB4], // Hot Pink
  [0x2E, 0xCC, 0x71], // Green
  [0x7C, 0xFC, 0x00], // Lime
  [0x1A, 0xBC, 0x9C], // Teal
  [0x34, 0x98, 0xDB], // Blue
  [0x00, 0xBF, 0xFF], // Deep Sky Blue
  [0x29, 0x80, 0xB9], // Darker Blue
  [0x9B, 0x59, 0xB6], // Purple
  [0x8E, 0x44, 0xAD], // Dark Purple
  [0x95, 0xA5, 0xA6], // Gray
  [0xBD, 0xC3, 0xC7], // Silver
  [0x8B, 0x45, 0x13], // Brown
  [0xF3, 0x9C, 0x12], // Gold
];

export const BASE_PLATE_COLOR = "#F5F5DC"; // Off-white / beige plate

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// sRGB to Lab conversion for perceptual color distance
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;
  const R = rs > 0.04045 ? Math.pow((rs + 0.055) / 1.055, 2.4) : rs / 12.92;
  const G = gs > 0.04045 ? Math.pow((gs + 0.055) / 1.055, 2.4) : gs / 12.92;
  const B = bs > 0.04045 ? Math.pow((bs + 0.055) / 1.055, 2.4) : bs / 12.92;
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
  const Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;
  const x = X / 0.95047;
  const y = Y / 1.00000;
  const z = Z / 1.08883;
  const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return [L, a, bb];
}

function labDistance(lab1: [number, number, number], lab2: [number, number, number]): number {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

/** Find nearest bead color in Lab space */
function findNearestBeadColor(r: number, g: number, b: number): string {
  const targetLab = rgbToLab(r, g, b);
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < BEAD_PALETTE.length; i++) {
    const lab = rgbToLab(BEAD_PALETTE[i][0], BEAD_PALETTE[i][1], BEAD_PALETTE[i][2]);
    const dist = labDistance(targetLab, lab);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return rgbToHex(BEAD_PALETTE[bestIdx][0], BEAD_PALETTE[bestIdx][1], BEAD_PALETTE[bestIdx][2]);
}

export interface ProcessImageResult {
  beads: BeadData[][];
  colorPalette: string[];
}

export async function processImage(
  imageBuffer: Buffer,
  gridSize: number
): Promise<ProcessImageResult> {
  // 1. Resize to gridSize x gridSize using nearest-neighbor (preserves pixel-art feel)
  const resized = await sharp(imageBuffer)
    .resize(gridSize, gridSize, { kernel: sharp.kernel.nearest })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const channels = info.channels;

  // 2. Collect all pixel colors
  const pixelColors: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += channels) {
    pixelColors.push([data[i], data[i + 1], data[i + 2]]);
  }

  // 3. Build bead grid: map each pixel DIRECTLY to nearest bead color
  //    Skip background detection — for perler-bead art the entire image is
  //    the pattern; there is no "background" to mask out. Direct mapping
  //    preserves the full AI-generated composition.
  const beads: BeadData[][] = [];
  const allColors: string[] = [];

  for (let y = 0; y < gridSize; y++) {
    const row: BeadData[] = [];
    for (let x = 0; x < gridSize; x++) {
      const idx = y * gridSize + x;
      const [r, g, b] = pixelColors[idx];
      const color = findNearestBeadColor(r, g, b);
      allColors.push(color);
      row.push({
        color,
        baseColor: BASE_PLATE_COLOR,
        wordOwner: "", // filled by block segmenter
        isUnlocked: false,
      });
    }
    beads.push(row);
  }

  // 5. Post-process: majority filter to remove isolated "noise" pixels
  //    This makes color regions more contiguous, matching real perler-bead art.
  function applyMajorityFilter(data: BeadData[][]): BeadData[][] {
    const size = data.length;
    const out: BeadData[][] = data.map((row) => row.map((b) => ({ ...b })));
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const neighborCounts = new Map<string, number>();
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            const c = data[y + dy][x + dx].color;
            neighborCounts.set(c, (neighborCounts.get(c) || 0) + 1);
          }
        }
        const current = data[y][x].color;
        const currentNeighbors = neighborCounts.get(current) || 0;
        // Only replace if current color has ZERO same-color neighbors (completely isolated)
        if (currentNeighbors === 0) {
          let bestColor = current;
          let bestCount = -1;
          for (const [c, count] of neighborCounts) {
            if (count > bestCount) {
              bestCount = count;
              bestColor = c;
            }
          }
          out[y][x].color = bestColor;
        }
      }
    }
    return out;
  }

  // Run 1 pass — enough to remove stray noise without destroying small features
  const smoothed = applyMajorityFilter(beads);

  // Rebuild allColors from smoothed grid
  const smoothedColors: string[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      smoothedColors.push(smoothed[y][x].color);
    }
  }

  // Extract top colors for palette
  const colorCounts = new Map<string, number>();
  for (const c of smoothedColors) {
    colorCounts.set(c, (colorCounts.get(c) || 0) + 1);
  }
  const sortedPalette = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([c]) => c);

  return { beads: smoothed, colorPalette: sortedPalette };
}
