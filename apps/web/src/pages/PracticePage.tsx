import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAtomValue, useSetAtom } from 'jotai'
import WordInput from '@/components/WordInput'
import { BeadBoard } from '@/components/BeadBoard'
import { useWordGroup } from '@/hooks/useWordGroup'
import { createMockBeadGrid } from '@/components/BeadBoard/mockData'
import { pickWordsByDifficulty } from '@/mocks/words'
import { beadGridAtom, loadGridAtom, setPartialUnlockAtom } from '@/store/beadStore'
import { generateBeadGrid, fetchWordBanks, fetchWords } from '@/lib/api'
import type { BeadGrid, Word } from '@/types'
import { Sparkles, Keyboard, Target, BookOpen, Eye, X } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Utils                                                             */
/* ------------------------------------------------------------------ */

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/* ------------------------------------------------------------------ */
/*  ThemeHint sub-component                                           */
/* ------------------------------------------------------------------ */

function ThemeHint({ explanation }: { explanation: string }) {
  return (
    <div className="relative bg-primary-muted border-l-4 border-primary rounded-r-xl p-4 mt-4">
      <Sparkles className="absolute top-3 right-3 w-4 h-4 text-primary" />
      <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
        AI 构思 / AI Thought
      </div>
      <p className="text-sm text-foreground">{explanation}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Difficulty Selector                                               */
/* ------------------------------------------------------------------ */

const DIFFICULTY_LABELS: Record<string, string> = {
  cet4: 'CET-4 (基础)',
  cet6: 'CET-6 (进阶)',
  gre: 'GRE (挑战)',
}

const DIFFICULTY_DESC: Record<string, string> = {
  cet4: '大学英语四级词汇，适合巩固基础',
  cet6: '大学英语六级词汇，难度适中',
  gre: 'GRE核心词汇，高难度挑战',
}

const WORD_COUNTS = [5, 10, 15, 20]
const REP_COUNTS = [1, 3, 5]
const REP_LABELS: Record<number, string> = {
  1: '1 遍 (速刷)',
  3: '3 遍 (标准)',
  5: '5 遍 (强化)',
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function PracticePage() {
  const {
    phase,
    currentSession,
    completedCount,
    totalWords,
    accuracy,
    elapsedMs,
    startPractice,
    submitCorrect,
    submitWrong,
    advance,
    continueCurrentWord,
    startTyping,
    restart,
    unlockCurrentBlock,
  } = useWordGroup()

  const beadGrid = useAtomValue(beadGridAtom)
  const loadGrid = useSetAtom(loadGridAtom)
  const setPartialUnlock = useSetAtom(setPartialUnlockAtom)

  const [themeExplanation, setThemeExplanation] = useState(
    "这幅拼豆画的灵感来自星空与海洋的交汇——正如单词所描绘的那样，自由的思想在广阔的宇宙中遨游，每一个词汇都是一颗独特的星辰。"
  )
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)

  const [difficulty, setDifficulty] = useState<'cet4' | 'cet6' | 'gre'>('cet6')
  const [wordCount, setWordCount] = useState(10)
  const [repsPerWord, setRepsPerWord] = useState(3)
  const [banksLoaded, setBanksLoaded] = useState(false)
  const [, setBankOptions] = useState<string[]>(['cet4', 'cet6', 'gre'])
  const [generatingImage, setGeneratingImage] = useState(false)

  /* Fetch available word banks from backend */
  useEffect(() => {
    fetchWordBanks()
      .then((banks) => {
        const ids = banks.map((b) => b.id)
        setBankOptions(ids.length ? ids : ['cet4', 'cet6', 'gre'])
        setBanksLoaded(true)
      })
      .catch(() => {
        setBanksLoaded(true)
      })
  }, [])

  const GRID_SIZE = 64

  /* Initialize session: fetch backend first, fallback to mock */
  const initSession = useCallback(async () => {
    let words: Word[] = []

    // Try backend word bank first
    try {
      const bankId = difficulty
      const fetched = await fetchWords(bankId, 200)
      const shuffled = [...fetched].sort(() => Math.random() - 0.5)
      words = shuffled.slice(0, wordCount).map((w, i) => ({
        id: w.id || `${bankId}_${String(i + 1).padStart(3, '0')}`,
        name: w.name,
        trans: w.trans,
        usphone: w.usphone,
        ukphone: w.ukphone,
        category: w.category || bankId.toUpperCase(),
      }))
    } catch (err) {
      console.warn('Backend word bank unavailable, using mock:', err)
      words = pickWordsByDifficulty(wordCount, difficulty)
    }

    // Generate bead grid
    setGeneratingImage(true)
    try {
      const res = await generateBeadGrid({
        words: words.map((w) => ({ id: w.id, name: w.name, trans: w.trans, usphone: w.usphone })),
        gridSize: GRID_SIZE,
        strategy: 'nature',
      })
      const grid: BeadGrid = {
        gridSize: res.beadData.gridSize,
        beads: res.beadData.beads,
        blocks: res.beadData.blocks,
      }
      loadGrid(grid)
      setThemeExplanation(res.themeExplanation)
      setImageUrl(res.imageUrl)
      startPractice(words, GRID_SIZE, grid, repsPerWord)
    } catch (err) {
      console.warn('Backend image gen unavailable, using mock:', err)
      const { beads, blocks } = createMockBeadGrid(GRID_SIZE)
      const grid: BeadGrid = { gridSize: GRID_SIZE, beads, blocks }
      loadGrid(grid)
      setImageUrl(null)
      startPractice(words, GRID_SIZE, grid, repsPerWord)
    } finally {
      setGeneratingImage(false)
    }
  }, [startPractice, loadGrid, difficulty, wordCount, repsPerWord])

  useEffect(() => {
    if (phase === 'idle' && banksLoaded) {
      initSession()
    }
  }, [phase, initSession, banksLoaded])

  const handleCorrect = useCallback(() => {
    submitCorrect()
  }, [submitCorrect])

  const handleWrong = useCallback(() => {
    submitWrong()
  }, [submitWrong])

  const handleUnlock = useCallback(() => {
    if (currentSession) {
      unlockCurrentBlock(currentSession.word.name)
    }
  }, [currentSession, unlockCurrentBlock])

  const handleLetterProgress = useCallback(
    (progress: number) => {
      if (currentSession) {
        const completedReps = currentSession.targetReps - currentSession.remainingReps
        const cumulative = (completedReps + progress) / currentSession.targetReps
        setPartialUnlock(currentSession.word.name, cumulative)
      }
    },
    [currentSession, setPartialUnlock]
  )

  /* Auto-advance after feedback */
  useEffect(() => {
    if (phase === 'feedback_correct') {
      const timer = setTimeout(() => {
        advance()
      }, 300)
      return () => clearTimeout(timer)
    }
    if (phase === 'feedback_wrong') {
      const timer = setTimeout(() => {
        continueCurrentWord()
      }, 400)
      return () => clearTimeout(timer)
    }
    if (phase === 'block_unlock') {
      const timer = setTimeout(() => {
        advance()
      }, 900)
      return () => clearTimeout(timer)
    }
  }, [phase, advance, continueCurrentWord])

  const handleStart = useCallback(() => {
    startTyping()
  }, [startTyping])

  const handleRestart = useCallback(() => {
    restart()
  }, [restart])

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Left: Bead Board */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="w-full flex items-center justify-between px-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            拼豆画板
          </h2>
          <div className="text-xs text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {completedCount}/{totalWords}
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {accuracy}%
            </span>
            {elapsedMs > 0 && <span>⏱ {formatTime(elapsedMs)}</span>}
            {imageUrl && (
              <button
                onClick={() => setShowOriginal(true)}
                className="flex items-center gap-1 text-primary hover:text-primary-hover transition-colors"
                title="查看 AI 原图"
              >
                <Eye className="w-3 h-3" />
                原图
              </button>
            )}
          </div>
        </div>

        {beadGrid ? (
          <BeadBoard />
        ) : (
          <div className="aspect-square w-full max-w-[520px] bg-muted rounded-2xl animate-pulse" />
        )}

        {/* ThemeHint panel */}
        <ThemeHint explanation={themeExplanation} />
      </div>

      {/* Right: Typing Panel */}
      <div className="w-full lg:w-[420px] flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {phase === 'idle' || phase === 'loading' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground"
            >
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p>{generatingImage ? 'AI 正在创作拼豆画，预计需要 30–60 秒…' : '加载中…'}</p>
            </motion.div>
          ) : phase === 'ready' ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-card border border-border rounded-2xl shadow-sm"
            >
              <h3 className="text-2xl font-bold text-foreground font-display">
                准备开始
              </h3>

              {/* Difficulty selector */}
              <div className="w-full space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    难度选择
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cet4', 'cet6', 'gre'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          difficulty === d
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {DIFFICULTY_LABELS[d]}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {DIFFICULTY_DESC[difficulty]}
                  </p>
                </div>

                {/* Word count selector */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    单词数量
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {WORD_COUNTS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setWordCount(n)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          wordCount === n
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {n} 词
                      </button>
                    ))}
                  </div>
                </div>

                {/* Repetition count selector */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    每词遍数
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {REP_COUNTS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setRepsPerWord(n)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          repsPerWord === n
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {REP_LABELS[n]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                本组共 {wordCount} 个{DIFFICULTY_LABELS[difficulty]}，每个单词需连续正确输入 {repsPerWord} 遍。
              </p>
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl transition-colors"
              >
                开始练习
              </button>
            </motion.div>
          ) : phase === 'completed' ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-card border border-border rounded-2xl shadow-sm"
            >
              <h3 className="text-2xl font-bold text-success font-display">
                🎉 全部解锁!
              </h3>
              <div className="text-center space-y-2 text-foreground">
                <p>⏱ 用时: {formatTime(elapsedMs)}</p>
                <p>🎯 正确率: {accuracy}%</p>
                <p className="text-xs text-muted-foreground">
                  {DIFFICULTY_LABELS[difficulty]} · {totalWords} 词 · {repsPerWord} 遍/词
                </p>
              </div>
              <button
                onClick={handleRestart}
                className="px-8 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl transition-colors"
              >
                再来一组
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 bg-card border border-border rounded-2xl shadow-sm"
            >
              <WordInput
                session={currentSession}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onUnlock={handleUnlock}
                onLetterProgress={handleLetterProgress}
                disabled={phase !== 'typing'}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl p-3">
          <div>
            <div className="text-lg font-bold text-foreground">{completedCount}</div>
            <div>已解锁</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">
              {totalWords - completedCount}
            </div>
            <div>待解锁</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{accuracy}%</div>
            <div>正确率</div>
          </div>
        </div>
      </div>

      {/* Admin: Original image overlay */}
      <AnimatePresence>
        {showOriginal && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowOriginal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-card rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">AI 原图预览</span>
                <button
                  onClick={() => setShowOriginal(false)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4">
                <img
                  src={imageUrl}
                  alt="AI 生成的原图"
                  className="w-full rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  左侧拼豆画板为该图的 64×64 像素化处理结果
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
