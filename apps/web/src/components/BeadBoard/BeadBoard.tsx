import { useRef, useEffect, useCallback, useState } from 'react'
import { useAtomValue } from 'jotai'
import {
  beadGridAtom,
  unlockedBlocksAtom,
  partialUnlocksAtom,
} from '@/store/beadStore'
import { drawBoard, animateBlockUnlock } from '@/utils/beadRenderer'
import type { BeadBoardProps, BeadData } from '@/types'
import { BeadBoardGrid } from './BeadBoardGrid'

interface TooltipState {
  visible: boolean
  x: number
  y: number
  text: string
}

export function BeadBoard({
  gridSize: gridSizeProp,
  beadData: beadDataProp,
  unlockedBlocks: unlockedBlocksProp,
  partialUnlocks: partialUnlocksProp,
  animationSpeed = 400,
  onBeadClick,
  beadGap = 1,
  beadRadius = 0.3,
  className = '',
  renderer = 'canvas',
}: BeadBoardProps) {
  /* -------------------------------------------------- */
  /* Jotai integration (fallback to props)              */
  /* -------------------------------------------------- */
  const atomGrid = useAtomValue(beadGridAtom)
  const atomUnlocked = useAtomValue(unlockedBlocksAtom)
  const atomPartial = useAtomValue(partialUnlocksAtom)

  const gridSize = gridSizeProp ?? atomGrid?.gridSize ?? 0
  const beadData = beadDataProp ?? atomGrid?.beads ?? []
  const unlockedBlocks = unlockedBlocksProp ?? atomUnlocked
  const partialUnlocks = partialUnlocksProp ?? atomPartial

  /* -------------------------------------------------- */
  /* Refs & DOM                                         */
  /* -------------------------------------------------- */
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(520)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  })
  const animatingRef = useRef(false)
  const prevUnlockedRef = useRef<Set<string>>(new Set(unlockedBlocks))
  const dprRef = useRef(1)

  /* Sync prevUnlockedRef when grid changes to avoid re-animating */
  useEffect(() => {
    prevUnlockedRef.current = new Set(unlockedBlocks)
  }, [gridSize, beadData])

  /* -------------------------------------------------- */
  /* Responsive sizing                                  */
  /* -------------------------------------------------- */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      // DESIGN.md §7 responsive sizing
      const w = Math.min(rect.width, 600)
      setContainerWidth(w)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* -------------------------------------------------- */
  /* Static draw                                        */
  /* -------------------------------------------------- */
  const getDisplayBeads = useCallback((): BeadData[][] => {
    const unlockedSet = new Set<string>(unlockedBlocks)
    return beadData.map((row) =>
      row.map((bead) => {
        const isFullyUnlocked = unlockedSet.has(bead.wordOwner)
        const isUnlocked = bead.isUnlocked || isFullyUnlocked
        return { ...bead, isUnlocked }
      })
    )
  }, [beadData, unlockedBlocks])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || gridSize === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr

    canvas.width = containerWidth * dpr
    canvas.height = containerWidth * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerWidth}px`

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const displayBeads = getDisplayBeads()
    drawBoard(ctx, displayBeads, containerWidth, containerWidth, {
      gap: beadGap,
      radius: beadRadius,
    })
  }, [gridSize, containerWidth, getDisplayBeads, beadGap, beadRadius])

  useEffect(() => {
    draw()
  }, [draw])

  /* -------------------------------------------------- */
  /* Unlock animation                                   */
  /* -------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || gridSize === 0 || renderer !== 'canvas') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const newlyUnlocked: string[] = []
    unlockedBlocks.forEach((word) => {
      if (!prevUnlockedRef.current.has(word)) {
        newlyUnlocked.push(word)
      }
    })
    prevUnlockedRef.current = new Set(unlockedBlocks)

    if (newlyUnlocked.length === 0 || animatingRef.current) return
    animatingRef.current = true

    // Collect beads belonging to newly unlocked blocks
    const beadsToAnimate: Array<{ bead: BeadData; x: number; y: number }> = []
    const beadSize = containerWidth / gridSize

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const bead = beadData[y]?.[x]
        if (!bead) continue
        if (newlyUnlocked.includes(bead.wordOwner)) {
          beadsToAnimate.push({
            bead: { ...bead, isUnlocked: true, color: bead.color },
            x,
            y,
          })
        }
      }
    }

    // Shuffle for organic reveal feel
    beadsToAnimate.sort(() => Math.random() - 0.5)

    // Build a mutable copy of beadData for the animation loop
    const animBeads = getDisplayBeads().map((row) => row.map((b) => ({ ...b })))

    const cancel = animateBlockUnlock(ctx, animBeads, beadsToAnimate, beadSize, {
      staggerMs: 30,
      beadDuration: animationSpeed,
      gap: beadGap,
      radius: beadRadius,
      onComplete: () => {
        animatingRef.current = false
        draw() // final clean draw with updated atom state
      },
    })

    return () => cancel()
  }, [
    unlockedBlocks,
    beadData,
    gridSize,
    containerWidth,
    animationSpeed,
    beadGap,
    beadRadius,
    renderer,
    getDisplayBeads,
    draw,
  ])

  /* -------------------------------------------------- */
  /* Interactions                                       */
  /* -------------------------------------------------- */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas || gridSize === 0) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const beadSize = containerWidth / gridSize
      const gx = Math.floor(x / beadSize)
      const gy = Math.floor(y / beadSize)

      if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) {
        setTooltip((t) => ({ ...t, visible: false }))
        return
      }

      const bead = beadData[gy]?.[gx]
      const isUnlocked =
        bead?.isUnlocked || unlockedBlocks.has(bead?.wordOwner ?? '')

      if (bead && isUnlocked) {
        setTooltip({
          visible: true,
          x: e.clientX + 12,
          y: e.clientY - 24,
          text: bead.wordOwner,
        })
      } else {
        setTooltip((t) => ({ ...t, visible: false }))
      }
    },
    [beadData, containerWidth, gridSize, unlockedBlocks]
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }))
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onBeadClick || gridSize === 0) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const beadSize = containerWidth / gridSize
      const gx = Math.floor(x / beadSize)
      const gy = Math.floor(y / beadSize)
      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        onBeadClick(gx, gy)
      }
    },
    [onBeadClick, containerWidth, gridSize]
  )

  /* -------------------------------------------------- */
  /* Render                                             */
  /* -------------------------------------------------- */
  if (renderer === 'grid') {
    return (
      <BeadBoardGrid
        gridSize={gridSize}
        beadData={beadData}
        unlockedBlocks={unlockedBlocks}
        partialUnlocks={partialUnlocks}
        onBeadClick={onBeadClick}
        className={className}
      />
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`relative aspect-square w-full max-w-[600px] mx-auto ${className}`}
        style={{
          backgroundColor: 'var(--bead-plate, #F2F0EC)',
          backgroundImage:
            'radial-gradient(circle at center, var(--bead-plate-dark, #D9D5CE) 0px, var(--bead-plate-dark, #D9D5CE) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
          borderRadius: '1rem',
          padding: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full rounded-lg cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
      </div>

      {tooltip.visible && (
        <div
          className="fixed z-50 px-2 py-1 text-xs text-white bg-black/80 rounded pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  )
}
