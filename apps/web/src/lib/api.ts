const API_BASE = 'http://localhost:3001'

export interface Word {
  id: string
  name: string
  trans: string[]
  usphone?: string
  ukphone?: string
  category?: string
}

export interface WordBankMeta {
  id: string
  name: string
  description: string
  wordCount: number
  category: string
}

export async function fetchWordBanks(): Promise<WordBankMeta[]> {
  const res = await fetch(`${API_BASE}/api/wordbanks`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchWords(bankId: string, count: number = 50): Promise<Word[]> {
  const res = await fetch(`${API_BASE}/api/wordbanks/${bankId}?page=1&size=${count}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.data as Word[]
}

export interface GenerateImageRequest {
  words: Array<{
    id: string
    name: string
    trans: string[]
    usphone?: string
  }>
  gridSize?: number
  strategy?: 'nature' | 'allusion' | 'quote'
}

export interface GenerateImageResponse {
  imageUrl: string
  beadData: {
    gridSize: number
    beads: Array<Array<{
      color: string
      baseColor: string
      wordOwner: string
      isUnlocked: boolean
    }>>
    blocks: Array<{
      wordName: string
      cells: Array<{ x: number; y: number }>
      colorPalette: string[]
    }>
  }
  themeExplanation: string
  estimatedTime: number
}

export async function generateBeadGrid(
  req: GenerateImageRequest
): Promise<GenerateImageResponse> {
  const controller = new AbortController()
  // AI image generation can take 30–90s; give it a generous timeout
  const timeoutId = setTimeout(() => controller.abort(), 120000)

  try {
    const res = await fetch(`${API_BASE}/api/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    return res.json()
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Image generation timed out after 120s')
    }
    throw err
  }
}
