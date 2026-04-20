import { atom } from 'jotai'
import type { BeadGrid, BeadData } from '@/types'

/* ------------------------------------------------------------------ */
/*  Default empty grid factory                                        */
/* ------------------------------------------------------------------ */

export function createEmptyGrid(size: number, baseColor: string = '#F5F5F0'): BeadData[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      color: baseColor,
      baseColor,
      wordOwner: '',
      isUnlocked: false,
    }))
  )
}

/* ------------------------------------------------------------------ */
/*  Atoms                                                             */
/* ------------------------------------------------------------------ */

/** The current bead grid (loaded from backend or empty) */
export const beadGridAtom = atom<BeadGrid | null>(null)

/** Which word blocks are fully unlocked */
export const unlockedBlocksAtom = atom<Set<string>>(new Set<string>())

/** Partial unlock percentages (challenge mode) */
export const partialUnlocksAtom = atom<Map<string, number>>(new Map())

/* ------------------------------------------------------------------ */
/*  Derived                                                           */
/* ------------------------------------------------------------------ */

/** Flat list of beads for Canvas renderer */
export const flatBeadsAtom = atom((get) => {
  const grid = get(beadGridAtom)
  if (!grid) return []
  return grid.beads.flat()
})

/** Unlocked bead count */
export const unlockedBeadCountAtom = atom((get) => {
  const grid = get(beadGridAtom)
  if (!grid) return 0
  return grid.beads.flat().filter((b) => b.isUnlocked).length
})

/** Total bead count */
export const totalBeadCountAtom = atom((get) => {
  const grid = get(beadGridAtom)
  if (!grid) return 0
  return grid.gridSize * grid.gridSize
})

/* ------------------------------------------------------------------ */
/*  Actions                                                           */
/* ------------------------------------------------------------------ */

/** Load a new grid from backend response */
export const loadGridAtom = atom(null, (_get, set, grid: BeadGrid) => {
  set(beadGridAtom, grid)
  set(unlockedBlocksAtom, new Set())
  set(partialUnlocksAtom, new Map())
})

/** Unlock a specific word block with animation callback support */
export const unlockBlockAtom = atom(null, (_get, set, wordName: string) => {
  const grid = _get(beadGridAtom)
  if (!grid) return []

  const block = grid.blocks.find((b) => b.wordName === wordName)
  if (!block) return []

  const newBeads = grid.beads.map((row) => row.map((b) => ({ ...b })))
  const unlockedCells: { x: number; y: number; color: string }[] = []

  block.cells.forEach(({ x, y }) => {
    if (newBeads[y] && newBeads[y][x]) {
      newBeads[y][x].isUnlocked = true
      unlockedCells.push({ x, y, color: newBeads[y][x].color })
    }
  })

  set(beadGridAtom, { ...grid, beads: newBeads })

  const prev = _get(unlockedBlocksAtom)
  set(unlockedBlocksAtom, new Set(prev).add(wordName))

  return unlockedCells
})

/** Set partial unlock percentage (per-letter unlock) */
export const setPartialUnlockAtom = atom(null, (_get, set, wordName: string, pct: number) => {
  const grid = _get(beadGridAtom)
  if (!grid) return

  const block = grid.blocks.find((b) => b.wordName === wordName)
  if (!block) return

  const clamped = Math.min(1, Math.max(0, pct))
  const count = Math.round(block.cells.length * clamped)

  /* Deterministic unlock: sort by distance from block centroid (center outward) */
  const cx = block.cells.reduce((s, c) => s + c.x, 0) / block.cells.length
  const cy = block.cells.reduce((s, c) => s + c.y, 0) / block.cells.length
  const sorted = [...block.cells].sort(
    (a, b) =>
      Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy)
  )

  /* Re-lock all beads in this block first, then unlock up to count */
  const newBeads = grid.beads.map((row) => row.map((b) => ({ ...b })))
  block.cells.forEach(({ x, y }) => {
    if (newBeads[y] && newBeads[y][x]) {
      newBeads[y][x].isUnlocked = false
    }
  })
  sorted.slice(0, count).forEach(({ x, y }) => {
    if (newBeads[y] && newBeads[y][x]) {
      newBeads[y][x].isUnlocked = true
    }
  })

  set(beadGridAtom, { ...grid, beads: newBeads })

  const map = new Map(_get(partialUnlocksAtom))
  map.set(wordName, clamped)
  set(partialUnlocksAtom, map)

  /* When fully unlocked, also mark in unlockedBlocksAtom */
  if (clamped >= 1) {
    const prev = _get(unlockedBlocksAtom)
    set(unlockedBlocksAtom, new Set(prev).add(wordName))
  }
})

/** Reset grid (new session) */
export const resetGridAtom = atom(null, (_get, set) => {
  set(beadGridAtom, null)
  set(unlockedBlocksAtom, new Set())
  set(partialUnlocksAtom, new Map())
})
