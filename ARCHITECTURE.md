# PixelWords / 拼豆单词 — Architecture Document

## 1. Overview

PixelWords is a vocabulary learning web application that combines spaced-repetition typing drills with pixel-art (perler bead / 拼豆) puzzle reveals. A group of words (e.g., 30) is drawn from the user's word bank; an AI generates a single atmospheric image inspired by the combined meanings of those words; the image is pixelated into an N×N bead grid. Each word is assigned a "word block" (an irregular cluster of beads). The user types each word repeatedly until mastery; each correct repetition unlocks beads in that word's block. When all blocks are unlocked, the full image is revealed with a framed "gallery" effect.

The grid size is configurable (default 20×20, scalable to 30×30, 50×50, 100×100).

## 2. Core User Journey

### 2.1 Practice Mode (练习模式)
1. User selects a word bank (CET-4, CET-6, GRE, custom, etc.).
2. System draws a random group of `K` words (default 30) from the bank.
3. System picks a random **Theme Strategy** (see §5.1) and sends the word list + strategy to the AI image service.
4. AI returns a high-resolution image.
5. Image pipeline: resize → color quantization (16–32 colors) → bead-grid mapping (N×N) → word-block segmentation (K blocks).
6. User sees the bead board (all beads = base plate color, e.g., off-white).
7. For each word, a "mastery counter" is initialized based on spaced-repetition state:
   - New word: 3 correct repetitions to unlock
   - Familiar word: 2 correct repetitions
   - Mastered word: 1 correct repetition
   - Error word (last attempt was wrong): 4 correct repetitions
8. System randomly presents a word from the group. User types it.
   - Correct → decrement mastery counter. If counter reaches 0, unlock the word's entire bead block with a pop animation.
   - Wrong → increment error counter, save to error book, present the word again soon.
9. Repeat until all K blocks are unlocked.
10. Full image revealed. A "framed gallery card" is generated (image + date + time spent + word group name + badge).
11. Side panel shows the "AI thought" — why this image was chosen for these words.

### 2.2 Challenge Mode (挑战模式 / 默写测试)
- Same group size, but each word appears exactly once.
- Unlock rate = accuracy percentage (e.g., 80% accuracy → 80% of beads unlocked, but scattered across blocks).
- Full image only revealed at 100% accuracy.

### 2.3 Speed Mode (限时模式) — Future
- 60-second timer. Each correct word unlocks 2 beads regardless of mastery.
- Pure arcade feel; not in MVP.

## 3. Tech Stack

### Frontend
| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 + Vite | Fast dev, qwerty-learner proven |
| State | Jotai | Atomic state, same as qwerty-learner |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, consistent design system |
| Animation | Framer Motion | Bead pop, reveal, frame effects |
| Bead Rendering | HTML5 Canvas 2D (primary) + CSS Grid fallback | Canvas handles 100×100 smoothly; Grid for accessibility |
| Storage | IndexedDB (Dexie.js) | Word banks, progress, error book, gallery |
| i18n | i18next | Chinese/English bilingual |

### Backend
| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 + Express | Lightweight, image pipeline libraries mature |
| Image Processing | Sharp (resize) + quantize (Median Cut) | Fast, Node-native |
| Word-block Segmentation | Custom algorithm (see §6) | Needs to be backend-side for deterministic seeding |
| AI Generation | Google Gemini 2.0 Flash Image Generation | Free tier generous, Chinese semantics strong |
| Cache | Redis | Image URL cache, rate-limit |
| DB | PostgreSQL | User accounts, gallery records, word bank metadata |
| Object Storage | Cloudflare R2 / AWS S3 | Generated images, gallery cards |

### DevOps
- Deployment: Frontend → Vercel; Backend → Fly.io / Render
- CI/CD: GitHub Actions
- Monitoring: Vercel Analytics + Sentry

## 4. Frontend Architecture

### 4.1 Directory Structure (Monorepo)
```
pixelwords/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── BeadBoard/          # Canvas/CSS bead renderer
│   │   │   │   ├── WordInput/          # Typing panel (qwerty-style)
│   │   │   │   ├── GalleryCard/        # Framed result card
│   │   │   │   ├── ThemeHint/          # Side panel: AI thought
│   │   │   │   └── ui/                 # shadcn primitives
│   │   │   ├── pages/
│   │   │   │   ├── PracticePage.tsx
│   │   │   │   ├── ChallengePage.tsx
│   │   │   │   ├── GalleryPage.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useBeadGrid.ts      # Bead state + unlock logic
│   │   │   │   ├── useWordGroup.ts     # Word selection + mastery
│   │   │   │   ├── useTypingEngine.ts  # Input handling + correctness
│   │   │   │   └── useGallery.ts       # Gallery CRUD
│   │   │   ├── store/
│   │   │   │   ├── beadStore.ts        # Jotai atoms for bead grid
│   │   │   │   ├── wordStore.ts        # Word group + progress
│   │   │   │   └── userStore.ts        # Settings, stats
│   │   │   ├── utils/
│   │   │   │   ├── beadRenderer.ts     # Canvas draw calls
│   │   │   │   ├── colorUtils.ts       # Hex ↔ bead color mapping
│   │   │   │   └── wordBankLoader.ts   # Load JSON word banks
│   │   │   └── types/
│   │   │       └── index.ts
│   │   └── package.json
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── image.ts            # POST /api/image/generate
│       │   │   ├── gallery.ts          # CRUD gallery
│       │   │   └── wordbank.ts         # Word bank metadata
│       │   ├── services/
│       │   │   ├── aiImage.ts          # Gemini client wrapper
│       │   │   ├── imagePipeline.ts    # Resize + quantize + segment
│       │   │   └── blockSegmenter.ts   # Word-block segmentation algo
│       │   ├── models/
│       │   │   ├── Gallery.ts
│       │   │   └── User.ts
│       │   └── index.ts
│       └── package.json
├── packages/
│   ├── shared-types/           # Shared TS types (BeadGrid, Word, etc.)
│   └── word-banks/             # JSON word bank files (from qwerty-learner)
└── turbo.json                  # Turborepo config
```

### 4.2 BeadBoard Component (核心组件)

**Props Interface:**
```typescript
interface BeadBoardProps {
  gridSize: number;           // N (e.g., 20, 30, 50, 100)
  beadData: BeadData[][];     // N×N array
  unlockedBlocks: Set<string>; // Set of word names whose blocks are fully unlocked
  partialUnlocks: Map<string, number>; // word → % unlocked (for challenge mode)
  animationSpeed: number;     // ms per bead pop
  onBeadClick?: (x: number, y: number) => void;
}

interface BeadData {
  color: string;       // Final bead color (hex)
  baseColor: string;   // Plate color (when locked)
  wordOwner: string;   // Which word owns this bead
  isUnlocked: boolean;
}
```

**Rendering Strategy:**
- Default: HTML5 Canvas 2D for performance (100×100 = 10,000 beads, Canvas handles at 60fps).
- Canvas draws each bead as a rounded rect with a pseudo-3D shadow to mimic a real perler bead.
- Unlock animation: scale bounce + slight glow via Canvas frame animation.
- Accessibility fallback: CSS Grid with ARIA labels for screen readers.

**Responsive Behavior:**
- Board container is `aspect-square` with `max-w-[600px]`.
- Canvas resolution = gridSize × beadSize (beadSize = containerWidth / gridSize).
- On retina displays, use `devicePixelRatio` scaling.

### 4.3 WordInput Component (打字输入板)

Heavily inspired by qwerty-learner's `WordPanel`:
- Display current word's phonetic, translation, and a progress bar (how many reps left to unlock).
- Input handling: instant per-letter validation with color feedback (green = correct, red = wrong).
- On mistake: force retype the entire word (qwerty-learner's anti-bad-muscle-memory rule).
- Sound feedback: correct chime, error buzz (Web Audio API).

### 4.4 GalleryCard Component (裱框特效)

After full unlock:
- Full-resolution image scales up from the bead board center.
- A decorative frame (wood/metal/gold variants) animates around it.
- Bottom plaque slides in: date, elapsed time, word group label, accuracy %.
- Confetti + sparkle particles (canvas-confetti).
- "Save to Gallery" button → IndexedDB + optional backend sync.

## 5. AI Image Generation Strategy

### 5.1 Theme Strategies (主题策略)

The backend randomly selects one of three strategies per group:

| Strategy | Prompt Template | Example (words: bird, sky, fly, freedom, wing) |
|---|---|---|
| **Allusion** (典故) | "Create a pixel-art style illustration depicting the story of [ALLUSION]. The scene should evoke: [word1 meaning], [word2 meaning], ..." | Icarus flying toward the sun, wings melting |
| **Quote** (名言) | "Create a pixel-art style illustration visualizing the poetic quote: '[QUOTE]'. The mood should reflect: [word meanings]" | "The caged bird sings of freedom" — Maya Angelou |
| **Nature/Life** (自然/生活) | "Create a pixel-art style illustration of a serene [SCENE] where [word1], [word2], and [word3] harmoniously coexist." | A bird soaring through a vast sky at dawn |

**Prompt Engineering Rules:**
- Always request "pixel art style, 32×32 or 64×64 resolution feel, vibrant but limited palette, no text, no letters, no watermarks".
- Add "flat lighting, no gradients, solid color blocks" to help downstream quantization.
- Chinese translations are included in the prompt for semantic accuracy.

### 5.2 API Flow

```
Frontend: POST /api/image/generate
Body: {
  words: [{ name: "bird", trans: ["鸟"], usphone: "bɜːrd" }, ...],
  gridSize: 20,
  strategy: "allusion" | "quote" | "nature"
}

Backend:
1. Check Redis cache (key = hash(wordNames + strategy + gridSize)).
2. If miss:
   a. Build prompt from strategy template.
   b. Call Gemini image generation (1024×1024).
   c. Download image to temp buffer.
   d. Run imagePipeline (see §6).
   e. Upload original + bead-data to R2.
   f. Cache metadata in Redis, beadData in DB.
3. Return: { imageUrl, beadData, blocks, themeExplanation }
```

## 6. Image Pipeline & Word-Block Segmentation

### 6.1 Pipeline Steps

```
[AI Image 1024×1024]
    ↓
[Sharp] Resize to gridSize × gridSize (e.g., 20×20) using nearest-neighbor
    ↓
[Quantize] Reduce to 16–32 colors using Median Cut algorithm
    ↓
[Color Mapping] Map each quantized color to a "bead color" from a curated palette
    ↓
[Block Segmentation] Divide the N×N grid into K irregular word blocks
    ↓
[Output] BeadData[][] + BlockMap
```

### 6.2 Color Quantization

- Use `quantize` npm package (Median Cut) or custom k-means in Lab color space.
- Target: 16 colors for 20×20, 32 colors for 50×50, 64 colors for 100×100.
- Background color detection: the most frequent color in the outer 1-pixel border is treated as "background". It is mapped to the plate base color and excluded from bead colors (or included if it appears in inner pixels).

### 6.3 Word-Block Segmentation Algorithm

**Goal:** Divide the N×N grid into K connected, roughly equal-area regions. Each region = one word's bead block.

**Algorithm (Seeded Region Growing with Voronoi initialization):**

1. **Seed Placement:** Place K random seeds inside the grid, ensuring minimum distance between seeds. Use a deterministic hash of word names as the RNG seed → same word group always produces same block layout (important for caching).
2. **Voronoi Initialization:** Assign each cell to the nearest seed. This gives K roughly equal regions.
3. **Region Growing (Noise Injection):** For each region, randomly "steal" border cells from neighbors with 15% probability. This creates irregular, organic-looking blocks (not perfect geometric shapes).
4. **Connected-Component Check:** Ensure each region is a single connected component. If a region is split, merge the smaller piece into the neighboring region with the longest shared border.
5. **Size Balancing:** Adjust region sizes so each word's block area is proportional to the word's length × its mastery requirement (longer/harder words get slightly larger blocks). Total must equal N×N.

**Properties:**
- Deterministic (same input → same output).
- Scales to any N and K.
- Blocks are irregular → harder to guess the image from partial unlocks.

### 6.4 Bead Color Palette

Curated palette inspired by real Hama/Perler bead colors:
```
#FFFFFF (White)    #F4D03F (Yellow)   #E74C3C (Red)
#2ECC71 (Green)    #3498DB (Blue)     #9B59B6 (Purple)
#E67E22 (Orange)   #1ABC9C (Teal)     #34495E (Dark Blue)
#95A5A6 (Gray)     #D35400 (Dark Or.) #C0392B (Dark Red)
#27AE60 (Dark Gr.) #2980B9 (Dark Bl.) #8E44AD (Dark Pu.)
#F39C12 (Gold)     #BDC3C7 (Silver)   #7F8C8D (Charcoal)
```
Each quantized color is matched to the nearest Lab-distance bead color.

## 7. Data Models

### 7.1 Word
```typescript
interface Word {
  id: string;           // "cet4_001"
  name: string;         // "bird"
  trans: string[];      // ["鸟", "禽"]
  usphone?: string;
  ukphone?: string;
  category: string;     // "CET-4", "GRE", etc.
}
```

### 7.2 WordGroup (Session)
```typescript
interface WordGroup {
  id: string;           // uuid
  words: Word[];
  gridSize: number;
  createdAt: Date;
  status: "active" | "completed" | "abandoned";
}
```

### 7.3 BeadGrid
```typescript
interface BeadGrid {
  gridSize: number;
  beads: BeadData[][];  // N×N
  blocks: WordBlock[];
}

interface WordBlock {
  wordName: string;
  cells: { x: number; y: number }[];
  colorPalette: string[]; // Dominant colors in this block
}
```

### 7.4 GalleryItem
```typescript
interface GalleryItem {
  id: string;
  groupId: string;
  imageUrl: string;
  beadGrid: BeadGrid;
  words: Word[];
  themeStrategy: string;
  themeExplanation: string;
  elapsedTimeMs: number;
  accuracy: number;     // 0–100
  completedAt: Date;
  frameStyle: "wood" | "metal" | "gold" | "minimal";
}
```

### 7.5 UserProgress
```typescript
interface UserProgress {
  wordId: string;
  correctCount: number;
  wrongCount: number;
  lastReviewed: Date;
  masteryLevel: "new" | "familiar" | "mastered" | "error";
  nextReview: Date;     // For future SRS scheduling
}
```

## 8. API Design

### 8.1 Image Generation
```http
POST /api/image/generate
Content-Type: application/json

{
  "words": [...],
  "gridSize": 20,
  "strategy": "allusion"
}

Response 200:
{
  "imageUrl": "https://r2.pixelwords.app/img/abc123.png",
  "thumbnailUrl": "https://r2.pixelwords.app/img/abc123_thumb.png",
  "beadData": { "gridSize": 20, "beads": [...], "blocks": [...] },
  "themeExplanation": "This image depicts Icarus flying toward the sun, symbolizing the freedom of flight and the danger of hubris.",
  "estimatedTime": 120
}
```

### 8.2 Gallery
```http
GET    /api/gallery         → List user's gallery items
POST   /api/gallery         → Save a completed group
GET    /api/gallery/:id     → Get single item
DELETE /api/gallery/:id     → Remove item
```

### 8.3 Word Banks
```http
GET /api/wordbanks          → List available banks
GET /api/wordbanks/:id      → Get words (paginated)
```

## 9. Memory Algorithm (Mastery)

Each word in a group starts with a **mastery target** based on its global SRS state:

| Global State | Target Reps | Logic |
|---|---|---|
| New (0 correct ever) | 5 | Fresh word needs heavy repetition to build initial memory trace |
| Familiar (1–2 correct) | 3 | Recognition forming but not solid yet |
| Mastered (3+ correct, low error rate) | 1 | Quick confirmation to maintain mastery |
| Error (last attempt wrong) | 5 | Reset to new-word level for thorough re-learning |

**Session Behavior:**
- Words are presented in random order, weighted toward lower-mastery words.
- Correct typing → decrement target. At 0 → block unlocks.
- Wrong typing → increment session error count, word stays in rotation.
- A word cannot be "completed" until it has been correctly typed consecutively the required number of times without an intervening error.

## 10. Security & Privacy

- API Keys (Gemini) stored in backend env vars only. Never exposed to frontend.
- Rate limiting: 10 image generations per IP per hour (Redis).
- Image content filter: Gemini's built-in safety filters + backend keyword blocklist.
- User auth: Optional. Anonymous users store everything in IndexedDB; logged-in users sync to backend.

## 11. Performance Considerations

- **Canvas rendering:** Use `requestAnimationFrame` only during unlock animations. Static board is a single draw call.
- **Image pipeline:** 20×20 grid processes in <50ms; 100×100 in <200ms. Backend caches everything.
- **Bundle size:** Lazy load Canvas renderer + image download modules. Core typing experience <200KB gzipped.
- **Offline support:** Service Worker caches word banks + previously generated bead data. Image generation requires network.

## 12. Future Roadmap

| Phase | Feature |
|---|---|
| MVP | 20×20 grid, Practice + Challenge mode, Gallery, 3 theme strategies |
| v1.1 | 30×30 / 50×50 grid, Speed mode, custom word banks |
| v1.2 | 100×100 grid, multiplayer "guess the image" mode, community gallery |
| v2.0 | Mobile app (React Native), AI-generated animated bead reveals |

## 13. Open Questions

1. Should the user see a "ghost outline" hint after being stuck on a word for >60s?
2. Should block unlock order be random, or always reveal from center outward for better aesthetic?
3. For 100×100 grids, should we stream the AI image generation progress to the frontend?
