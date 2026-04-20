import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Word, WordGroup, UserProgress, WordSessionState, GamePhase, GameState } from '@/types'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

export const TARGET_REPS = {
  new: 3,
  familiar: 3,
  mastered: 3,
  error: 3,
} as const

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

function getTargetReps(progress?: UserProgress): number {
  if (!progress) return TARGET_REPS.new
  return TARGET_REPS[progress.masteryLevel]
}

/** Track recent errors for "30% reappear within 3 rounds" logic */
interface ErrorHistoryEntry {
  wordId: string
  round: number
}

function pickNextWordId(
  states: Map<string, WordSessionState>,
  recentErrors: ErrorHistoryEntry[],
  currentRound: number
): string | null {
  const pending = Array.from(states.values()).filter((s) => s.status !== 'completed')
  if (pending.length === 0) return null

  /* 30% chance: promote a recently-errored word if within 3 rounds */
  const recentErrorIds = recentErrors
    .filter((e) => currentRound - e.round <= 3)
    .map((e) => e.wordId)

  if (recentErrorIds.length > 0 && Math.random() < 0.3) {
    const candidates = pending.filter((s) => recentErrorIds.includes(s.word.id))
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)].word.id
    }
  }

  /* weighted random: higher remainingReps = higher weight */
  const weights = pending.map((s) => s.remainingReps)
  const total = weights.reduce((a, b) => a + b, 0)
  let rnd = Math.random() * total
  for (let i = 0; i < pending.length; i++) {
    rnd -= weights[i]
    if (rnd <= 0) return pending[i].word.id
  }
  return pending[0].word.id
}

/* ------------------------------------------------------------------ */
/*  Persistent atoms                                                  */
/* ------------------------------------------------------------------ */

/** User's global progress per word (synced to backend later) */
export const userProgressAtom = atomWithStorage<Record<string, UserProgress>>(
  'pw_userProgress',
  {}
)

/** Current active / last game state (hydrated on load) */
export const gameStateAtom = atom<GameState>({
  phase: 'idle',
  wordGroup: null,
  sessionStates: new Map(),
  currentWordId: null,
  accuracy: 0,
  startTime: null,
  endTime: null,
})

/** Recent error history (session-only, not persisted) */
export const errorHistoryAtom = atom<ErrorHistoryEntry[]>([])

/** Round counter (increments every time a word is presented) */
export const roundCounterAtom = atom(0)

/* ------------------------------------------------------------------ */
/*  Derived atoms                                                     */
/* ------------------------------------------------------------------ */

/** Current word session */
export const currentSessionAtom = atom((get) => {
  const gs = get(gameStateAtom)
  if (!gs.currentWordId) return null
  return gs.sessionStates.get(gs.currentWordId) ?? null
})

/** How many words are fully unlocked */
export const completedCountAtom = atom((get) => {
  const gs = get(gameStateAtom)
  return Array.from(gs.sessionStates.values()).filter((s) => s.status === 'completed').length
})

/** Total words in current group */
export const totalWordsAtom = atom((get) => {
  const gs = get(gameStateAtom)
  return gs.wordGroup?.words.length ?? 0
})

/** Overall accuracy so far */
export const overallAccuracyAtom = atom((get) => {
  const gs = get(gameStateAtom)
  let total = 0
  let correct = 0
  gs.sessionStates.forEach((s) => {
    const successCount = s.targetReps - s.remainingReps
    total += successCount + s.errorCount
    correct += successCount
  })
  return total === 0 ? 0 : Math.round((correct / total) * 100)
})

/* ------------------------------------------------------------------ */
/*  Action atoms                                                      */
/* ------------------------------------------------------------------ */

/** Start a new practice session with a group of words */
export const startSessionAtom = atom(
  null,
  (_get, set, words: Word[], gridSize: number = 20, repsPerWord?: number) => {
    const progressMap = _get(userProgressAtom)
    const sessionStates = new Map<string, WordSessionState>()

    words.forEach((w) => {
      const target = repsPerWord ?? getTargetReps(progressMap[w.id])
      sessionStates.set(w.id, {
        word: w,
        targetReps: target,
        remainingReps: target,
        errorCount: 0,
        status: 'pending',
        attempt: 0,
      })
    })

    const group: WordGroup = {
      id: makeId(),
      words,
      gridSize,
      createdAt: new Date(),
      status: 'active',
    }

    const firstWordId = pickNextWordId(sessionStates, [], 0)
    if (firstWordId) {
      const first = sessionStates.get(firstWordId)!
      first.status = 'active'
      sessionStates.set(firstWordId, first)
    }

    set(gameStateAtom, {
      phase: 'ready',
      wordGroup: group,
      sessionStates,
      currentWordId: firstWordId,
      accuracy: 0,
      startTime: null,
      endTime: null,
    })
    set(errorHistoryAtom, [])
    set(roundCounterAtom, 0)
  }
)

/** Record a correct attempt */
export const recordCorrectAtom = atom(null, (_get, set) => {
  const gs = { ..._get(gameStateAtom) }
  if (!gs.currentWordId) return

  const states = new Map(gs.sessionStates)
  const session = { ...states.get(gs.currentWordId)! }

  session.remainingReps -= 1
  session.attempt += 1
  if (session.remainingReps <= 0) {
    session.status = 'completed'
    session.remainingReps = 0
  }
  states.set(gs.currentWordId, session)

  let phase: GamePhase = 'feedback_correct'
  if (session.status === 'completed') {
    phase = 'block_unlock'
  }

  if (!gs.startTime) gs.startTime = Date.now()

  set(gameStateAtom, { ...gs, sessionStates: states, phase })
})

/** Record a wrong attempt */
export const recordWrongAtom = atom(null, (_get, set) => {
  const gs = { ..._get(gameStateAtom) }
  if (!gs.currentWordId) return

  const states = new Map(gs.sessionStates)
  const session = { ...states.get(gs.currentWordId)! }

  session.errorCount += 1
  session.attempt += 1
  /* keep remainingReps unchanged — this attempt simply didn't count */
  session.status = 'active'
  states.set(gs.currentWordId, session)

  if (!gs.startTime) gs.startTime = Date.now()

  /* Track this error for reappearance logic */
  const round = _get(roundCounterAtom)
  const history = [..._get(errorHistoryAtom)]
  history.push({ wordId: gs.currentWordId, round })
  set(errorHistoryAtom, history)

  set(gameStateAtom, { ...gs, sessionStates: states, phase: 'feedback_wrong' })
})

/** Continue typing the same word after feedback */
export const continueSessionAtom = atom(null, (_get, set) => {
  const gs = { ..._get(gameStateAtom) }
  set(gameStateAtom, { ...gs, phase: 'typing' })
})

/** Advance to next word after feedback animation */
export const nextWordAtom = atom(null, (_get, set) => {
  const gs = { ..._get(gameStateAtom) }
  const states = new Map(gs.sessionStates)

  const round = _get(roundCounterAtom) + 1
  const history = _get(errorHistoryAtom)

  const nextId = pickNextWordId(states, history, round)
  if (!nextId) {
    /* all done */
    set(gameStateAtom, {
      ...gs,
      phase: 'completed',
      currentWordId: null,
      endTime: Date.now(),
    })
    return
  }

  /* mark current as pending if not completed, mark next as active */
  if (gs.currentWordId) {
    const cur = states.get(gs.currentWordId)
    if (cur && cur.status === 'active') {
      states.set(gs.currentWordId, { ...cur, status: 'pending' })
    }
  }

  const next = states.get(nextId)!
  states.set(nextId, { ...next, status: 'active' })

  set(roundCounterAtom, round)
  set(gameStateAtom, {
    ...gs,
    sessionStates: states,
    currentWordId: nextId,
    phase: 'typing',
  })
})

/** Transition from ready → typing */
export const beginTypingAtom = atom(null, (_get, set) => {
  const gs = _get(gameStateAtom)
  set(gameStateAtom, { ...gs, phase: 'typing', startTime: Date.now() })
})

/** Reset game */
export const resetGameAtom = atom(null, (_get, set) => {
  set(gameStateAtom, {
    phase: 'idle',
    wordGroup: null,
    sessionStates: new Map(),
    currentWordId: null,
    accuracy: 0,
    startTime: null,
    endTime: null,
  })
  set(errorHistoryAtom, [])
  set(roundCounterAtom, 0)
})
