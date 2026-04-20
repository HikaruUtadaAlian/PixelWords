import type { BeadRenderOptions, BeadData } from '@/types'

/**
 * Draw a single perler-bead style rounded-rect on canvas.
 * Includes pseudo-3D shading to mimic a real bead sitting on a pegboard.
 */
export function drawBead(options: BeadRenderOptions): void {
  const {
    ctx,
    x,
    y,
    size,
    color,
    isUnlocked,
    gap = 1,
    radius = 0.3,
    glow = 0,
    scale = 1,
  } = options

  const drawSize = size * scale
  const offset = (size - drawSize) / 2
  const drawX = x + offset
  const drawY = y + offset
  const r = Math.max(0, drawSize * radius)

  // Locked beads show a uniform placeholder color to hide the pattern
  const displayColor = isUnlocked ? color : '#3A3A3A'

  ctx.save()

  // Glow effect during unlock animation
  if (glow > 0 && isUnlocked) {
    ctx.shadowColor = displayColor
    ctx.shadowBlur = glow * 12
  }

  // Main bead body (rounded rect)
  const path = new Path2D()
  roundRect(path, drawX + gap / 2, drawY + gap / 2, drawSize - gap, drawSize - gap, r)
  ctx.fillStyle = displayColor
  ctx.fill(path)

  if (!isUnlocked) {
    // Locked bead: uniform dark placeholder with subtle texture
    // Extra dark overlay for matte look
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fill(path)
    // Subtle center dot (peg shadow)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    const dot = new Path2D()
    dot.arc(drawX + size / 2 + 0.5, drawY + size / 2 + 0.5, size * 0.08, 0, Math.PI * 2)
    ctx.fill(dot)
    ctx.restore()
    return
  }

  // Unlocked bead: pseudo-3D shading
  // Inner highlight (top-left)
  const hlPath = new Path2D()
  roundRect(
    hlPath,
    drawX + gap / 2 + drawSize * 0.06,
    drawY + gap / 2 + drawSize * 0.06,
    drawSize * 0.48 - gap,
    drawSize * 0.38 - gap,
    r * 0.6
  )
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fill(hlPath)

  // Bottom-right shadow
  const shPath = new Path2D()
  roundRect(
    shPath,
    drawX + gap / 2 + drawSize * 0.35,
    drawY + gap / 2 + drawSize * 0.42,
    drawSize * 0.55 - gap,
    drawSize * 0.48 - gap,
    r * 0.5
  )
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.fill(shPath)

  // Center indent (the bead hole)
  const holeSize = Math.max(3, drawSize * 0.22)
  const holeCX = drawX + drawSize / 2
  const holeCY = drawY + drawSize / 2

  // Hole shadow
  ctx.beginPath()
  ctx.ellipse(
    holeCX + holeSize * 0.12,
    holeCY + holeSize * 0.12,
    holeSize / 2,
    holeSize / 2,
    0,
    0,
    Math.PI * 2
  )
  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  ctx.fill()

  // Hole highlight
  ctx.beginPath()
  ctx.ellipse(
    holeCX - holeSize * 0.04,
    holeCY - holeSize * 0.04,
    holeSize / 2,
    holeSize / 2,
    0,
    0,
    Math.PI * 2
  )
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fill()

  // Hole center (slightly darker than bead color)
  ctx.beginPath()
  ctx.ellipse(
    holeCX + holeSize * 0.04,
    holeCY + holeSize * 0.04,
    holeSize / 2,
    holeSize / 2,
    0,
    0,
    Math.PI * 2
  )
  ctx.fillStyle = shadeColor(displayColor, -0.06)
  ctx.fill()

  ctx.restore()
}

/**
 * Draw the full bead board in a single pass.
 * Call this for static renders (no animation).
 */
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  beadData: BeadData[][],
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    gap?: number
    radius?: number
    unlockedBlocks?: Set<string>
    partialUnlocks?: Map<string, number>
    animatingBeads?: Map<string, { scale: number; glow: number }>
  }
): void {
  const gridSize = beadData.length
  if (gridSize === 0) return

  const { gap = 1, radius = 0.3, animatingBeads } = options || {}
  const beadSize = canvasWidth / gridSize

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const bead = beadData[y]?.[x]
      if (!bead) continue

      const px = x * beadSize
      const py = y * beadSize
      const key = `${x},${y}`
      const anim = animatingBeads?.get(key)

      drawBead({
        ctx,
        x: px,
        y: py,
        size: beadSize,
        color: bead.color,
        isUnlocked: bead.isUnlocked,
        gap,
        radius,
        glow: anim?.glow ?? 0,
        scale: anim?.scale ?? 1,
      })
    }
  }
}

/* ------------------------------------------------------------------ */
/* Animation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Batch animate unlocking a list of beads with staggered delay.
 * Uses a single rAF loop that redraws the whole board each frame.
 * This avoids overlap artifacts when beads scale beyond cell bounds.
 */
export function animateBlockUnlock(
  ctx: CanvasRenderingContext2D,
  fullBeadData: BeadData[][],
  beads: Array<{ bead: BeadData; x: number; y: number }>,
  beadSize: number,
  options?: {
    staggerMs?: number
    beadDuration?: number
    gap?: number
    radius?: number
    onBeadComplete?: (x: number, y: number) => void
    onComplete?: () => void
  }
): () => void {
  const {
    staggerMs = 30,
    beadDuration = 400,
    gap = 1,
    radius = 0.3,
    onBeadComplete,
    onComplete,
  } = options || {}

  const startTime = performance.now()
  const totalBeads = beads.length
  let rafId: number
  let completedCount = 0

  const tick = (now: number) => {
    const animatingMap = new Map<string, { scale: number; glow: number }>()
    let hasAnimating = false

    for (let i = 0; i < totalBeads; i++) {
      const item = beads[i]
      const elapsed = now - startTime - i * staggerMs
      if (elapsed < 0) continue

      const t = Math.min(elapsed / beadDuration, 1)
      const scale = 1 + 0.35 * elasticOut(t)
      const glow = t < 0.5 ? t * 2 : (1 - t) * 2

      animatingMap.set(`${item.x},${item.y}`, { scale, glow })
      hasAnimating = true

      if (t >= 1) {
        // Mark bead as unlocked in fullBeadData so next frames show it static
        if (fullBeadData[item.y] && fullBeadData[item.y][item.x]) {
          fullBeadData[item.y][item.x].isUnlocked = true
        }
        onBeadComplete?.(item.x, item.y)
        completedCount++
      }
    }

    drawBoard(ctx, fullBeadData, beadSize * fullBeadData.length, beadSize * fullBeadData.length, {
      gap,
      radius,
      animatingBeads: animatingMap,
    })

    if (hasAnimating && completedCount < totalBeads) {
      rafId = requestAnimationFrame(tick)
    } else {
      onComplete?.()
    }
  }

  rafId = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(rafId)
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function roundRect(
  path: Path2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (w <= 0 || h <= 0) return
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  path.moveTo(x + radius, y)
  path.arcTo(x + w, y, x + w, y + h, radius)
  path.arcTo(x + w, y + h, x, y + h, radius)
  path.arcTo(x, y + h, x, y, radius)
  path.arcTo(x, y, x + w, y, radius)
  path.closePath()
}

function elasticOut(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

/**
 * Lighten or darken a hex color by a fraction (-1 to 1).
 */
function shadeColor(color: string, percent: number): string {
  if (!color || typeof color !== 'string' || !color.startsWith('#')) {
    return '#808080'
  }
  const f = parseInt(color.slice(1), 16)
  if (isNaN(f)) return '#808080'
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent)
  const R = f >> 16
  const G = (f >> 8) & 0x00ff
  const B = f & 0x0000ff
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  )
}
