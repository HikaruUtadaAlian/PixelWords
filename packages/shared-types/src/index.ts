export interface Word {
  id: string;
  name: string;
  trans: string[];
  usphone?: string;
  ukphone?: string;
  category: string;
}

export interface WordGroup {
  id: string;
  words: Word[];
  gridSize: number;
  createdAt: Date;
  status: "active" | "completed" | "abandoned";
}

export interface BeadData {
  color: string;
  baseColor: string;
  wordOwner: string;
  isUnlocked: boolean;
}

export interface WordBlock {
  wordName: string;
  cells: { x: number; y: number }[];
  colorPalette: string[];
}

export interface BeadGrid {
  gridSize: number;
  beads: BeadData[][];
  blocks: WordBlock[];
}

export interface GalleryItem {
  id: string;
  groupId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  beadGrid: BeadGrid;
  words: Word[];
  themeStrategy: string;
  themeExplanation: string;
  elapsedTimeMs: number;
  accuracy: number;
  completedAt: Date;
  frameStyle: "wood" | "metal" | "gold" | "minimal";
}

export interface UserProgress {
  wordId: string;
  correctCount: number;
  wrongCount: number;
  lastReviewed: Date;
  masteryLevel: "new" | "familiar" | "mastered" | "error";
  nextReview: Date;
}

export interface GenerateImageRequest {
  words: Word[];
  gridSize: number;
  strategy: "allusion" | "quote" | "nature";
}

export interface GenerateImageResponse {
  imageUrl: string;
  thumbnailUrl?: string;
  beadData: BeadGrid;
  themeExplanation: string;
  estimatedTime: number;
}

export interface WordBankMeta {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  category: string;
}
