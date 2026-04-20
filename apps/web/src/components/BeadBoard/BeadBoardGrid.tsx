import { useState, useCallback } from 'react'
import type { BeadBoardProps } from '@/types'

export function BeadBoardGrid({
  gridSize,
  beadData,
  unlockedBlocks,
  partialUnlocks: _partialUnlocks,
  onBeadClick,
  className = '',
}: Required<Pick<BeadBoardProps, 'gridSize' | 'beadData' | 'unlockedBlocks'>> &
  Pick<BeadBoardProps, 'partialUnlocks' | 'onBeadClick' | 'className'>) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    text: string
  }>({ visible: false, x: 0, y: 0, text: '' })

  const unlockedSet = new Set<string>(unlockedBlocks)

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, bead: import('@/types').BeadData, isUnlocked: boolean) => {
      if (!isUnlocked) return
      setTooltip({
        visible: true,
        x: e.clientX + 12,
        y: e.clientY - 24,
        text: bead.wordOwner,
      })
    },
    []
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }))
  }, [])

  return (
    <>
      <div
        className={`w-full max-w-[600px] mx-auto aspect-square rounded-2xl overflow-hidden p-3 ${className}`}
        style={{
          backgroundColor: 'var(--bead-plate, #F2F0EC)',
          backgroundImage:
            'radial-gradient(circle at center, var(--bead-plate-dark, #D9D5CE) 0px, var(--bead-plate-dark, #D9D5CE) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="grid w-full h-full rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            gap: '1px',
          }}
          role="img"
          aria-label={`拼豆画板，${gridSize}乘${gridSize}格子`}
        >
          {beadData.map((row, y) =>
            row.map((bead, x) => {
              const isFullyUnlocked = unlockedSet.has(bead.wordOwner)
              const isUnlocked = bead.isUnlocked || isFullyUnlocked

              // Locked beads show a uniform placeholder color to hide the pattern
              const color = isUnlocked ? bead.color : '#3A3A3A'

              return (
                <div
                  key={`${x}-${y}`}
                  className={`w-full h-full transition-all duration-300 ${
                    isUnlocked ? 'hover:brightness-110 hover:scale-105' : ''
                  }`}
                  style={{
                    backgroundColor: color,
                    borderRadius: '20%',
                    opacity: 1,
                    boxShadow: isUnlocked
                      ? 'inset 2px 2px 4px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.1)'
                      : 'inset 1px 1px 2px rgba(0,0,0,0.15)',
                  }}
                  onClick={() => onBeadClick?.(x, y)}
                  onMouseEnter={(e) =>
                    handleMouseEnter(e, bead, isUnlocked)
                  }
                  onMouseLeave={handleMouseLeave}
                  role="button"
                  aria-label={`格子 ${x + 1},${y + 1}${
                    isUnlocked ? `，属于单词 ${bead.wordOwner}` : ''
                  }`}
                  tabIndex={0}
                />
              )
            })
          )}
        </div>
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
