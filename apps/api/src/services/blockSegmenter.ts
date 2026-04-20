import type { BeadData, WordBlock } from "@pixelwords/shared-types";

// Deterministic RNG using xorshift
function makeSeededRng(seed: string) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  let x = s || 123456789;
  let y = 362436069;
  let z = 521288629;
  let w = 88675123;
  return function random() {
    const t = (x ^ (x << 11)) >>> 0;
    x = y;
    y = z;
    z = w;
    w = (w ^ (w >>> 19) ^ (t ^ (t >>> 8))) >>> 0;
    return w / 0xffffffff;
  };
}

export function segmentBlocks(
  gridSize: number,
  beads: BeadData[][],
  words: { name: string }[],
  seed: string
): WordBlock[] {
  const wordNames = words.map((w) => w.name);
  const K = wordNames.length;
  const N = gridSize;
  const totalCells = N * N;

  if (K === 0) return [];
  if (K === 1) {
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) cells.push({ x, y });
    }
    for (const cell of cells) {
      beads[cell.y][cell.x].wordOwner = wordNames[0];
    }
    return [{ wordName: wordNames[0], cells, colorPalette: extractPalette(beads, cells) }];
  }

  const rng = makeSeededRng(seed);

  // 1. Seed placement: K random seeds with minimum distance
  interface Seed { x: number; y: number }
  const seeds: Seed[] = [];
  const minDist = Math.max(1, Math.floor(N / (K * 0.8)));
  let attempts = 0;
  while (seeds.length < K && attempts < K * 200) {
    attempts++;
    const sx = Math.floor(rng() * N);
    const sy = Math.floor(rng() * N);
    let ok = true;
    for (const s of seeds) {
      const d = Math.abs(s.x - sx) + Math.abs(s.y - sy);
      if (d < minDist) { ok = false; break; }
    }
    if (ok) seeds.push({ x: sx, y: sy });
  }
  while (seeds.length < K) {
    seeds.push({ x: Math.floor(rng() * N), y: Math.floor(rng() * N) });
  }

  // 2. Voronoi initialization
  const owner = new Int32Array(totalCells).fill(-1);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < K; i++) {
        const d = Math.pow(seeds[i].x - x, 2) + Math.pow(seeds[i].y - y, 2);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      owner[y * N + x] = bestIdx;
    }
  }

  // 3. Region growing with noise injection (15% steal probability)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const idx = y * N + x;
      const currentOwner = owner[idx];
      const neighbors: number[] = [];
      if (x > 0) neighbors.push(owner[idx - 1]);
      if (x < N - 1) neighbors.push(owner[idx + 1]);
      if (y > 0) neighbors.push(owner[idx - N]);
      if (y < N - 1) neighbors.push(owner[idx + N]);
      for (const nb of neighbors) {
        if (nb !== currentOwner && rng() < 0.15) {
          owner[idx] = nb;
          break;
        }
      }
    }
  }

  // 4. Connected-component check: ensure each region is connected
  const visited = new Uint8Array(totalCells).fill(0);
  const regions: { idx: number; cells: number[] }[] = [];
  for (let i = 0; i < K; i++) regions.push({ idx: i, cells: [] });

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const cell = y * N + x;
      regions[owner[cell]].cells.push(cell);
    }
  }

  for (let r = 0; r < K; r++) {
    const cells = regions[r].cells;
    if (cells.length === 0) continue;
    const compMap = new Map<number, number[]>();
    for (const c of cells) visited[c] = 0;
    for (const start of cells) {
      if (visited[start]) continue;
      const queue = [start];
      visited[start] = 1;
      const comp: number[] = [];
      while (queue.length) {
        const cur = queue.shift()!;
        comp.push(cur);
        const cx = cur % N;
        const cy = Math.floor(cur / N);
        const nbs = [
          cx > 0 ? cur - 1 : -1,
          cx < N - 1 ? cur + 1 : -1,
          cy > 0 ? cur - N : -1,
          cy < N - 1 ? cur + N : -1,
        ];
        for (const nb of nbs) {
          if (nb >= 0 && !visited[nb] && owner[nb] === r) {
            visited[nb] = 1;
            queue.push(nb);
          }
        }
      }
      compMap.set(start, comp);
    }
    if (compMap.size > 1) {
      const comps = Array.from(compMap.values()).sort((a, b) => b.length - a.length);
      for (let ci = 1; ci < comps.length; ci++) {
        const comp = comps[ci];
        const neighborCounts = new Map<number, number>();
        for (const c of comp) {
          const cx = c % N;
          const cy = Math.floor(c / N);
          const nbs = [
            cx > 0 ? c - 1 : -1,
            cx < N - 1 ? c + 1 : -1,
            cy > 0 ? c - N : -1,
            cy < N - 1 ? c + N : -1,
          ];
          for (const nb of nbs) {
            if (nb >= 0 && owner[nb] !== r) {
              neighborCounts.set(owner[nb], (neighborCounts.get(owner[nb]) || 0) + 1);
            }
          }
        }
        let bestNeighbor = 0;
        let bestCount = -1;
        for (const [nbr, count] of neighborCounts) {
          if (count > bestCount) {
            bestCount = count;
            bestNeighbor = nbr;
          }
        }
        for (const c of comp) {
          owner[c] = bestNeighbor;
        }
      }
    }
  }

  // 5. Size balancing: proportional to word length
  const currentSizes = new Array(K).fill(0);
  for (let i = 0; i < totalCells; i++) currentSizes[owner[i]]++;

  const lengths = wordNames.map((w) => w.length);
  const totalLength = lengths.reduce((a, b) => a + b, 0);
  const targets = lengths.map((len) => Math.round((len / totalLength) * totalCells));
  let diff = totalCells - targets.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    for (let i = 0; i < K && diff !== 0; i++) {
      if (diff > 0) { targets[i]++; diff--; }
      else if (diff < 0 && targets[i] > 1) { targets[i]--; diff++; }
    }
  }

  const regionCells: number[][] = Array.from({ length: K }, () => []);
  for (let i = 0; i < totalCells; i++) regionCells[owner[i]].push(i);

  for (let iter = 0; iter < 10; iter++) {
    for (let r = 0; r < K; r++) {
      while (regionCells[r].length > targets[r]) {
        let moved = false;
        for (let ci = 0; ci < regionCells[r].length; ci++) {
          const c = regionCells[r][ci];
          const cx = c % N;
          const cy = Math.floor(c / N);
          const nbs = [
            cx > 0 ? c - 1 : -1,
            cx < N - 1 ? c + 1 : -1,
            cy > 0 ? c - N : -1,
            cy < N - 1 ? c + N : -1,
          ];
          for (const nb of nbs) {
            if (nb < 0) continue;
            const nbOwner = owner[nb];
            if (nbOwner !== r && regionCells[nbOwner].length < targets[nbOwner]) {
              regionCells[r].splice(ci, 1);
              regionCells[nbOwner].push(c);
              owner[c] = nbOwner;
              moved = true;
              break;
            }
          }
          if (moved) break;
        }
        if (!moved) break;
      }
    }
  }

  // Build WordBlock array and assign wordOwner to beads
  const blocks: WordBlock[] = [];
  for (let r = 0; r < K; r++) {
    const cells = regionCells[r].map((idx) => ({ x: idx % N, y: Math.floor(idx / N) }));
    for (const cell of cells) {
      beads[cell.y][cell.x].wordOwner = wordNames[r];
    }
    blocks.push({
      wordName: wordNames[r],
      cells,
      colorPalette: extractPalette(beads, cells),
    });
  }

  return blocks;
}

function extractPalette(beads: BeadData[][], cells: { x: number; y: number }[]): string[] {
  const colorCounts = new Map<string, number>();
  for (const { x, y } of cells) {
    const c = beads[y][x].color;
    colorCounts.set(c, (colorCounts.get(c) || 0) + 1);
  }
  const sorted = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 5).map(([c]) => c);
}
