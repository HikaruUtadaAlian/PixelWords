import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import {
  gameStateAtom,
  currentSessionAtom,
  startSessionAtom,
  recordCorrectAtom,
  recordWrongAtom,
  nextWordAtom,
  beginTypingAtom,
  resetGameAtom,
  continueSessionAtom,
  completedCountAtom,
  totalWordsAtom,
  overallAccuracyAtom,
} from '@/store/wordStore'
import { loadGridAtom, unlockBlockAtom } from '@/store/beadStore'
import type { Word, BeadGrid } from '@/types'

export function useWordGroup() {
  const gameState = useAtomValue(gameStateAtom)
  const currentSession = useAtomValue(currentSessionAtom)
  const completedCount = useAtomValue(completedCountAtom)
  const totalWords = useAtomValue(totalWordsAtom)
  const accuracy = useAtomValue(overallAccuracyAtom)

  const startSession = useSetAtom(startSessionAtom)
  const recordCorrect = useSetAtom(recordCorrectAtom)
  const recordWrong = useSetAtom(recordWrongAtom)
  const nextWord = useSetAtom(nextWordAtom)
  const beginTyping = useSetAtom(beginTypingAtom)
  const resetGame = useSetAtom(resetGameAtom)
  const continueSession = useSetAtom(continueSessionAtom)
  const loadGrid = useSetAtom(loadGridAtom)
  const unlockBlock = useSetAtom(unlockBlockAtom)

  const startPractice = useCallback(
    (words: Word[], gridSize: number = 20, beadGrid?: BeadGrid, repsPerWord?: number) => {
      startSession(words, gridSize, repsPerWord)
      if (beadGrid) {
        loadGrid(beadGrid)
      }
    },
    [startSession, loadGrid]
  )

  const submitCorrect = useCallback(() => {
    recordCorrect()
  }, [recordCorrect])

  const submitWrong = useCallback(() => {
    recordWrong()
  }, [recordWrong])

  const advance = useCallback(() => {
    nextWord()
  }, [nextWord])

  const continueCurrentWord = useCallback(() => {
    continueSession()
  }, [continueSession])

  const startTyping = useCallback(() => {
    beginTyping()
  }, [beginTyping])

  const restart = useCallback(() => {
    resetGame()
  }, [resetGame])

  const unlockCurrentBlock = useCallback(
    (wordName: string) => {
      return unlockBlock(wordName)
    },
    [unlockBlock]
  )

  const elapsedMs =
    gameState.startTime && gameState.endTime
      ? gameState.endTime - gameState.startTime
      : gameState.startTime
        ? Date.now() - gameState.startTime
        : 0

  return {
    phase: gameState.phase,
    wordGroup: gameState.wordGroup,
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
  }
}
