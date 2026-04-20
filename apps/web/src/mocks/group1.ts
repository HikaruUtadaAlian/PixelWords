import type { Word, SentenceItem } from '@/types'

/** Unit 4-6 Group 1: 「热浪绿洲」— 自然与旅途 */

export const GROUP1_WORDS: Word[] = [
  {
    id: 'u4_oasis',
    name: 'oasis',
    trans: ['绿洲', '乐土'],
    usphone: 'oʊˈeɪsɪs',
    category: 'Unit 4-6',
  },
  {
    id: 'u4_slope',
    name: 'slope',
    trans: ['斜坡', '倾斜'],
    usphone: 'sloʊp',
    category: 'Unit 4-6',
  },
  {
    id: 'u4_trek',
    name: 'trek',
    trans: ['长途跋涉', '艰苦行进'],
    usphone: 'trek',
    category: 'Unit 4-6',
  },
  {
    id: 'u4_soaring',
    name: 'soaring',
    trans: ['翱翔的', '猛增的'],
    usphone: 'ˈsɔːrɪŋ',
    category: 'Unit 4-6',
  },
  {
    id: 'u4_steeply',
    name: 'steeply',
    trans: ['陡峭地', '急剧地'],
    usphone: 'ˈstiːpli',
    category: 'Unit 4-6',
  },
  {
    id: 'u4_blast',
    name: 'blast',
    trans: ['一阵风', '爆炸', '猛烈冲击'],
    usphone: 'blæst',
    category: 'Unit 4-6',
  },
  {
    id: 'u4_scent',
    name: 'scent',
    trans: ['气味', '香味', '嗅觉'],
    usphone: 'sent',
    category: 'Unit 4-6',
  },
]

/** Sentences interleaved between words */
export const GROUP1_SENTENCES: SentenceItem[] = [
  {
    id: 'u4s_1',
    text: 'After a long trek up the steeply rising slope, the travelers finally saw the oasis.',
    translation: '经过长途跋涉，爬上陡峭的斜坡，旅行者们终于看到了绿洲。',
    highlightWords: ['trek', 'steeply', 'slope', 'oasis'],
  },
  {
    id: 'u4s_2',
    text: 'A sudden blast of wind carried the sweet scent of flowers from the soaring cliffs above.',
    translation: '一阵突如其来的风带来了上方高耸悬崖上的花香。',
    highlightWords: ['blast', 'scent', 'soaring'],
  },
]

/** The climax sentence — typed after all blocks are unlocked */
export const GROUP1_CLIMAX_SENTENCE: SentenceItem = {
  id: 'u4s_climax',
  text: 'At the edge of the oasis, where the steep slope met the sky, the soaring eagle dived into a blast of golden wind, and the scent of home filled the air.',
  translation: '在绿洲的边缘，陡峭的斜坡与天空相接之处，翱翔的雄鹰俯冲入一阵金色的风中，家的气息弥漫在空气中。',
  highlightWords: ['oasis', 'steep', 'slope', 'soaring', 'blast', 'scent'],
}

/**
 * Build the full typing sequence: words interleaved with sentences.
 * Pattern: Word1 → Word2 → Sentence1 → Word3 → Word4 → Sentence2 → ...
 */
export function buildGroup1Sequence(): Word[] {
  const words = [...GROUP1_WORDS]
  const sentences = [...GROUP1_SENTENCES]
  const sequence: Word[] = []

  let wIdx = 0
  let sIdx = 0

  // Interleave: 2 words → 1 sentence → repeat
  while (wIdx < words.length || sIdx < sentences.length) {
    // Add up to 2 words
    for (let i = 0; i < 2 && wIdx < words.length; i++) {
      sequence.push(words[wIdx++])
    }
    // Add 1 sentence if available
    if (sIdx < sentences.length) {
      const s = sentences[sIdx++]
      sequence.push({
        id: s.id,
        name: s.text,
        trans: [s.translation],
        category: 'Unit 4-6',
        isSentence: true,
        highlightWords: s.highlightWords,
        sentenceData: s,
      })
    }
  }

  return sequence
}
