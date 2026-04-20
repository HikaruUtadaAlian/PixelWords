export interface SentenceItem {
  id: string
  text: string
  translation: string
  highlightWords: string[]
  source?: string
}

export interface Word {
  id: string
  name: string
  trans: string[]
  usphone?: string
  ukphone?: string
  category: string
  /** If true, this "word" is actually a sentence/phrase to be typed */
  isSentence?: boolean
  /** For sentences: which words from the group appear in this sentence */
  highlightWords?: string[]
  /** For sentences: the original sentence data */
  sentenceData?: SentenceItem
}

export interface UserProgress {
  wordId: string
  correctCount: number
  wrongCount: number
  lastReviewed: Date
  masteryLevel: 'new' | 'familiar' | 'mastered' | 'error'
  nextReview: Date
}

export interface BeadData {
  color: string
  baseColor: string
  wordOwner: string
  isUnlocked: boolean
}

export interface WordBlock {
  wordName: string
  cells: { x: number; y: number }[]
  colorPalette: string[]
}

export interface BeadGrid {
  gridSize: number
  beads: BeadData[][]
  blocks: WordBlock[]
}

export interface WordGroup {
  id: string
  words: Word[]
  gridSize: number
  createdAt: Date
  status: 'active' | 'completed' | 'abandoned'
}

export interface GalleryItem {
  id: string
  groupId: string
  imageUrl: string
  beadGrid: BeadGrid
  words: Word[]
  themeStrategy: string
  themeExplanation: string
  elapsedTimeMs: number
  accuracy: number
  completedAt: Date
  frameStyle: 'wood' | 'metal' | 'gold' | 'minimal'
}

export type GamePhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'typing'
  | 'feedback_correct'
  | 'feedback_wrong'
  | 'block_unlock'
  | 'completed'

export interface WordSessionState {
  word: Word
  targetReps: number
  remainingReps: number
  errorCount: number
  status: 'pending' | 'active' | 'completed'
  attempt: number
}

export interface GameState {
  phase: GamePhase
  wordGroup: WordGroup | null
  sessionStates: Map<string, WordSessionState>
  currentWordId: string | null
  accuracy: number
  startTime: number | null
  endTime: number | null
}

export interface TypingResult {
  isCorrect: boolean
  input: string
  target: string
  charResults: CharResult[]
}

export interface CharResult {
  char: string
  status: 'correct' | 'wrong' | 'pending' | 'extra'
}

export interface BeadRenderOptions {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  size: number
  color: string
  isUnlocked: boolean
  gap?: number
  radius?: number
  glow?: number
  scale?: number
}

export interface BeadBoardProps {
  gridSize?: number
  beadData?: BeadData[][]
  unlockedBlocks?: Set<string>
  partialUnlocks?: Map<string, number>
  animationSpeed?: number
  onBeadClick?: (x: number, y: number) => void
  beadGap?: number
  beadRadius?: number
  className?: string
  renderer?: 'canvas' | 'grid'
}

export interface GenerateImageRequest {
  words: Word[]
  gridSize?: number
  strategy?: 'nature' | 'allusion' | 'quote'
}

export interface GenerateImageResponse {
  imageUrl: string
  beadData: BeadGrid
  themeExplanation: string
  estimatedTime: number
}
