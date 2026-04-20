import type { BeadData, WordBlock } from '../../types'

// 拼豆 curated palette (from ARCHITECTURE.md §6.4)
export const BEAD_PALETTE = [
  '#FFFFFF', '#F4D03F', '#E74C3C',
  '#2ECC71', '#3498DB', '#9B59B6',
  '#E67E22', '#1ABC9C', '#34495E',
  '#95A5A6', '#D35400', '#C0392B',
  '#27AE60', '#2980B9', '#8E44AD',
  '#F39C12', '#BDC3C7', '#7F8C8D',
]

export const BASE_PLATE_COLOR = '#F5F5DC'

export const MOCK_WORDS = ['apple', 'ocean', 'flame', 'forest', 'sky']

export const MOCK_COLORS = ['#E74C3C', '#3498DB', '#E67E22', '#27AE60', '#2980B9']

/**
 * Create a simple mock bead grid with 5 word blocks.
 * Uses a Voronoi-like assignment for organic block shapes.
 */
export function createMockBeadGrid(gridSize = 30): {
  beads: BeadData[][]
  blocks: WordBlock[]
} {
  const beads: BeadData[][] = []
  const blocks: WordBlock[] = []

  // Seed positions for 5 blocks (deterministic)
  const seeds = [
    { x: 5, y: 5, word: MOCK_WORDS[0], color: MOCK_COLORS[0] },
    { x: 15, y: 5, word: MOCK_WORDS[1], color: MOCK_COLORS[1] },
    { x: 10, y: 10, word: MOCK_WORDS[2], color: MOCK_COLORS[2] },
    { x: 5, y: 15, word: MOCK_WORDS[3], color: MOCK_COLORS[3] },
    { x: 15, y: 15, word: MOCK_WORDS[4], color: MOCK_COLORS[4] },
  ]

  // Assign each cell to nearest seed
  for (let y = 0; y < gridSize; y++) {
    const row: BeadData[] = []
    for (let x = 0; x < gridSize; x++) {
      let nearest = seeds[0]
      let minDist = Infinity

      for (const seed of seeds) {
        const dist = Math.hypot(x - seed.x, y - seed.y)
        if (dist < minDist) {
          minDist = dist
          nearest = seed
        }
      }

      // Add some noise for irregular borders
      const noise = Math.random()
      const isBorder = minDist > 2 && minDist < 5 && noise > 0.7
      const owner = isBorder
        ? seeds[Math.floor(Math.random() * seeds.length)].word
        : nearest.word
      const color = seeds.find((s) => s.word === owner)?.color ?? nearest.color

      row.push({
        color,
        baseColor: BASE_PLATE_COLOR,
        wordOwner: owner,
        isUnlocked: false,
      })
    }
    beads.push(row)
  }

  // Build block metadata
  for (const seed of seeds) {
    const cells: { x: number; y: number }[] = []
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (beads[y][x].wordOwner === seed.word) {
          cells.push({ x, y })
        }
      }
    }
    blocks.push({
      wordName: seed.word,
      cells,
      colorPalette: [seed.color],
    })
  }

  return { beads, blocks }
}

/**
 * Generate progressively more unlocked states for demo/testing.
 */
export function createMockUnlockSequence(
  gridSize = 30
): Array<{ beads: BeadData[][]; unlockedBlocks: Set<string> }> {
  const { beads } = createMockBeadGrid(gridSize)
  const sequence: Array<{ beads: BeadData[][]; unlockedBlocks: Set<string> }> = []

  sequence.push({
    beads: beads.map((row) => row.map((b) => ({ ...b }))),
    unlockedBlocks: new Set(),
  })

  for (let i = 0; i < MOCK_WORDS.length; i++) {
    const prev = sequence[sequence.length - 1]
    const nextBeads = prev.beads.map((row) =>
      row.map((b) => {
        if (b.wordOwner === MOCK_WORDS[i]) {
          return { ...b, isUnlocked: true }
        }
        return { ...b }
      })
    )
    const nextUnlocked = new Set(prev.unlockedBlocks)
    nextUnlocked.add(MOCK_WORDS[i])
    sequence.push({ beads: nextBeads, unlockedBlocks: nextUnlocked })
  }

  return sequence
}
