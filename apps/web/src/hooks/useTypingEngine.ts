import { useState, useCallback, useEffect, useRef } from 'react'
import type { CharResult } from '@/types'

export type InputPhase = 'idle' | 'inputting' | 'correct' | 'wrong'

export interface UseTypingEngineReturn {
  input: string
  isCorrect: boolean
  isComplete: boolean
  charResults: CharResult[]
  shake: boolean
  reset: () => void
  correctCount: number
}

function validateInput(input: string, target: string): CharResult[] {
  const results: CharResult[] = []
  for (let i = 0; i < target.length; i++) {
    if (i < input.length) {
      results.push({
        char: target[i],
        status: input[i] === target[i] ? 'correct' : 'wrong',
      })
    } else {
      results.push({
        char: target[i],
        status: 'pending',
      })
    }
  }
  /* extras beyond target length */
  for (let i = target.length; i < input.length; i++) {
    results.push({
      char: input[i],
      status: 'extra',
    })
  }
  return results
}

/**
 * Typing engine hook.
 * Listens to window keydown events globally so the user can type
 * without an focused input field (qwerty-learner style).
 */
export function useTypingEngine(targetWord: string): UseTypingEngineReturn {
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<InputPhase>('idle')
  const [shake, setShake] = useState(false)
  const isLocked = useRef(false)
  const targetRef = useRef(targetWord)

  targetRef.current = targetWord

  const charResults = validateInput(input, targetWord)
  const isCorrect = phase === 'correct'
  const isComplete = phase === 'correct'
  const correctCount = input.length

  const reset = useCallback(() => {
    setInput('')
    setPhase('idle')
    setShake(false)
    isLocked.current = false
  }, [])

  /* Reset whenever target word changes */
  useEffect(() => {
    reset()
  }, [targetWord, reset])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked.current) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Tab') return

      const target = targetRef.current
      if (!target) return

      if (e.key === 'Backspace') {
        setInput((prev) => prev.slice(0, -1))
        setPhase('inputting')
        return
      }

      if (e.key.length !== 1) return

      const nextInput = input + e.key
      setInput(nextInput)
      setPhase('inputting')

      /* Check correctness at every keystroke (qwerty-learner style) */
      const idx = nextInput.length - 1
      if (nextInput[idx] !== target[idx]) {
        /* Mistake: lock, shake, then reset */
        isLocked.current = true
        setPhase('wrong')
        setShake(true)

        setTimeout(() => {
          setInput('')
          setPhase('idle')
          setShake(false)
          isLocked.current = false
        }, 300)
        return
      }

      /* Fully correct */
      if (nextInput === target) {
        isLocked.current = true
        setPhase('correct')
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [input])

  return {
    input,
    isCorrect,
    isComplete,
    charResults,
    shake,
    reset,
    correctCount,
  }
}
