import { useState, useCallback } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  beadGridAtom,
  unlockedBlocksAtom,
  loadGridAtom,
  unlockBlockAtom,
} from '@/store/beadStore'
import { BeadBoard } from './BeadBoard'
import { createMockBeadGrid, MOCK_WORDS } from './mockData'

export function BeadBoardDemo() {
  const [beadGrid] = useAtom(beadGridAtom)
  const [unlockedBlocks, setUnlockedBlocks] = useAtom(unlockedBlocksAtom)
  const loadGrid = useSetAtom(loadGridAtom)
  const unlockBlock = useSetAtom(unlockBlockAtom)

  const [renderer, setRenderer] = useState<'canvas' | 'grid'>('canvas')
  const [clickedCell, setClickedCell] = useState('')

  /* Initialize mock grid once */
  const initMock = useCallback(() => {
    const { beads, blocks } = createMockBeadGrid(20)
    loadGrid({ gridSize: 20, beads, blocks })
  }, [loadGrid])

  const handleUnlockNext = useCallback(() => {
    if (!beadGrid) return
    const nextWord = MOCK_WORDS.find((w) => !unlockedBlocks.has(w))
    if (nextWord) {
      unlockBlock(nextWord)
    }
  }, [beadGrid, unlockedBlocks, unlockBlock])

  const handleReset = useCallback(() => {
    setUnlockedBlocks(new Set())
    initMock()
  }, [initMock, setUnlockedBlocks])

  const handleBeadClick = useCallback((x: number, y: number) => {
    setClickedCell(`Clicked: (${x}, ${y})`)
    setTimeout(() => setClickedCell(''), 1500)
  }, [])

  const progress = Math.round(
    (unlockedBlocks.size / MOCK_WORDS.length) * 100
  )

  if (!beadGrid) {
    return (
      <div className="min-h-screen bg-stone-100 p-8 flex items-center justify-center">
        <button
          onClick={initMock}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          加载 Mock 数据
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-stone-800">
          拼豆渲染引擎 Demo
        </h1>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow">
          <button
            onClick={handleUnlockNext}
            disabled={unlockedBlocks.size >= MOCK_WORDS.length}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              unlockedBlocks.size >= MOCK_WORDS.length
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            解锁下一个词块
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
          >
            重置
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-stone-600">Renderer:</span>
            <select
              value={renderer}
              onChange={(e) =>
                setRenderer(e.target.value as 'canvas' | 'grid')
              }
              className="px-2 py-1 text-sm border rounded"
            >
              <option value="canvas">Canvas 2D</option>
              <option value="grid">CSS Grid</option>
            </select>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-stone-600 w-12 text-right">
            {progress}%
          </span>
        </div>

        {/* Board */}
        <BeadBoard
          gridSize={beadGrid.gridSize}
          beadData={beadGrid.beads}
          unlockedBlocks={unlockedBlocks}
          renderer={renderer}
          onBeadClick={handleBeadClick}
          className="shadow-lg"
        />

        {/* Status */}
        <div className="flex justify-between text-sm text-stone-500">
          <span>
            Unlocked: {unlockedBlocks.size} / {MOCK_WORDS.length} words
          </span>
          <span>{clickedCell}</span>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="font-semibold text-stone-700 mb-2">
              Canvas 2D 渲染器
            </h3>
            <ul className="text-sm text-stone-600 space-y-1">
              <li>圆角矩形拼豆 + 3D 高光/阴影</li>
              <li>中心凹陷（模拟拼豆孔）</li>
              <li>解锁弹入动画（elastic easing）</li>
              <li>Retina DPR 缩放</li>
              <li>Hover 显示所属单词 tooltip</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="font-semibold text-stone-700 mb-2">
              CSS Grid 降级
            </h3>
            <ul className="text-sm text-stone-600 space-y-1">
              <li>纯 div + Tailwind 样式</li>
              <li>无障碍支持（ARIA 标签）</li>
              <li>屏幕阅读器兼容</li>
              <li>打印友好</li>
              <li>通过 props 一键切换</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
