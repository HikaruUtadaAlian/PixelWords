import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, CheckCircle2, XCircle } from 'lucide-react'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import type { WordSessionState } from '@/types'

/* ------------------------------------------------------------------ */
/*  Sound helpers (Web Audio API)                                     */
/* ------------------------------------------------------------------ */

function playCorrectSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch {
    /* ignore */
  }
}

function playWrongSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    /* ignore */
  }
}

function playUnlockSound() {
  try {
    const ctx = new AudioContext()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.08)
      osc.stop(ctx.currentTime + i * 0.08 + 0.15)
    })
  } catch {
    /* ignore */
  }
}

function speakWord(word: string) {
  if (!window.speechSynthesis) return
  const utter = new SpeechSynthesisUtterance(word)
  utter.lang = 'en-US'
  utter.rate = 0.9
  window.speechSynthesis.speak(utter)
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface WordInputProps {
  session: WordSessionState | null
  onCorrect: () => void
  onWrong: () => void
  onUnlock?: () => void
  onLetterProgress?: (progress: number) => void
  disabled?: boolean
}

const shakeAnimation = {
  x: [0, -8, 8, -6, 6, -3, 3, 0],
  transition: { duration: 0.4 },
}

export default function WordInput({
  session,
  onCorrect,
  onWrong,
  onUnlock,
  onLetterProgress,
  disabled,
}: WordInputProps) {
  const prevKeyRef = useRef<string>('')
  const hasPlayedUnlockRef = useRef(false)
  const hasFiredCorrectRef = useRef(false)
  const hasFiredWrongRef = useRef(false)
  const prevProgressRef = useRef(0)

  const { input, isComplete, charResults, shake, reset, correctCount } = useTypingEngine(
    session?.word.name ?? ''
  )

  /* Notify parent on letter progress */
  useEffect(() => {
    if (disabled || !session) return
    const wordLen = session.word.name.length
    if (wordLen === 0) return
    const progress = correctCount / wordLen
    if (progress !== prevProgressRef.current) {
      prevProgressRef.current = progress
      onLetterProgress?.(progress)
    }
  }, [correctCount, session, onLetterProgress, disabled])

  /* Notify parent on complete / wrong */
  useEffect(() => {
    if (disabled || !session) return
    if (isComplete && !hasFiredCorrectRef.current) {
      hasFiredCorrectRef.current = true
      playCorrectSound()
      const isNowComplete = session.remainingReps <= 1
      onCorrect()
      if (isNowComplete && onUnlock && !hasPlayedUnlockRef.current) {
        hasPlayedUnlockRef.current = true
        playUnlockSound()
        onUnlock()
      }
    }
  }, [isComplete, session, onCorrect, onUnlock, disabled])

  useEffect(() => {
    if (disabled) return
    if (shake && !hasFiredWrongRef.current) {
      hasFiredWrongRef.current = true
      playWrongSound()
      onWrong()
    }
  }, [shake, onWrong, disabled])

  /* Reset engine tracking when word or attempt changes */
  useEffect(() => {
    if (!session) return
    const key = `${session.word.name}_${session.attempt}`
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key
      hasPlayedUnlockRef.current = false
      hasFiredCorrectRef.current = false
      hasFiredWrongRef.current = false
      prevProgressRef.current = 0
      reset()
    }
  }, [session?.word.name, session?.attempt, reset])

  const handleSpeak = useCallback(() => {
    if (session) speakWord(session.word.name)
  }, [session])

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        等待单词…
      </div>
    )
  }

  const word = session.word
  const progress = session.targetReps - session.remainingReps
  const pct = (progress / session.targetReps) * 100
  const remaining = session.remainingReps - (isComplete ? 1 : 0)

  return (
    <div className="flex flex-col items-center gap-6 p-6 select-none">
      {/* Word header */}
      <div className="text-center space-y-2">
        <motion.div
          key={word.name}
          animate={shake ? shakeAnimation : {}}
          className="font-mono font-bold text-5xl tracking-widest text-foreground"
        >
          {word.name}
        </motion.div>

        {word.usphone && (
          <div className="flex items-center justify-center gap-2">
            <p className="font-mono text-sm text-muted-foreground">/{word.usphone}/</p>
            <button
              onClick={handleSpeak}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="朗读单词"
            >
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        <p className="text-lg font-medium text-primary">{word.trans.join('；')}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>解锁进度</span>
          <span>{Math.max(0, remaining)} 遍后解锁</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Letter grid */}
      <motion.div
        key={`grid-${word.name}`}
        animate={shake ? shakeAnimation : {}}
        className="flex flex-wrap justify-center gap-2 max-w-2xl"
      >
        {charResults.map((cr, i) => {
          const isCursor = i === input.length && !isComplete && !shake
          let cellClass =
            'relative inline-flex items-center justify-center w-11 h-14 text-2xl font-mono font-bold rounded-lg border-2 transition-colors duration-150 '

          if (cr.status === 'correct') {
            cellClass += 'border-success bg-success-muted text-success'
          } else if (cr.status === 'wrong' || cr.status === 'extra') {
            cellClass += 'border-destructive bg-destructive-muted text-destructive'
          } else {
            cellClass += 'border-border bg-card text-muted-foreground'
          }

          return (
            <span key={i} className={cellClass}>
              {cr.char}
              {isCursor && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full animate-pulse" />
              )}
            </span>
          )
        })}
      </motion.div>

      {/* Feedback */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 text-success font-bold text-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            正确!
          </motion.div>
        )}
        {shake && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 text-destructive font-bold text-lg"
          >
            <XCircle className="w-5 h-5" />
            错误，请重输
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <p className="text-xs text-muted-foreground mt-2">
        提示：直接输入字母，无需按 Enter。输错会强制从头重打。
      </p>
    </div>
  )
}
