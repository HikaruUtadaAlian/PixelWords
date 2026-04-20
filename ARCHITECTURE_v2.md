# PixelWords / 拼豆单词 — 架构文档 v2.0

> 本文档基于当前代码状态（2026-04-20）编写，包含**已实现**与**待实现**两大部分。
> 核心理念：单词分组 → AI 生成拼豆画 → 打字解锁 → 例句串成剧情 → 闯关通关。

---

## 1. 已实现的模块

### 1.1 前端核心

| 模块 | 状态 | 说明 |
|---|---|---|
| BeadBoard（拼豆板） | ✅ Canvas 2D 渲染 | 64×64 网格，拼豆 3D 效果（高光+阴影+中心孔），解锁弹跳动画 |
| BeadBoard（CSS Grid 降级） | ✅ 可用 | 无障碍/屏幕阅读器支持 |
| WordInput（打字面板） | ✅ 完成 | 全局键盘监听，逐字母实时反馈，输错强制重置，音效+语音朗读 |
| 打字引擎 (useTypingEngine) | ✅ 完成 | qwerty-learner 风格，即时校验，抖动反馈 |
| 状态管理 (Jotai) | ✅ 完成 | wordStore（单词掌握度、SRS）、beadStore（网格解锁） |
| 练习页面 (PracticePage) | ✅ 完成 | 难度选择、单词数量(5/10/15/20)、遍数(1/3/5)、统计面板 |
| 主题提示栏 (ThemeHint) | ✅ 完成 | AI 构思说明展示 |
| 响应式布局 | ✅ 完成 | 桌面双栏 / 移动端垂直堆叠 |
| 拼豆渲染器 (beadRenderer.ts) | ✅ 完成 | 单帧绘制、批量解锁动画 (rAF + stagger) |

### 1.2 后端核心

| 模块 | 状态 | 说明 |
|---|---|---|
| Express API 框架 | ✅ 完成 | `/api/image/generate`, `/api/gallery`, `/api/wordbanks` |
| AI 图片生成 (aiImage.ts) | ✅ SiliconFlow 接入 | Qwen-Image 模型，三种主题策略（典故/名言/自然） |
| 图片管线 (imagePipeline.ts) | ✅ 完成 | Sharp 缩放 → Lab 色彩量化 → 拼豆色板映射 → 多数滤波去噪 |
| 分块算法 (blockSegmenter.ts) | ✅ 完成 | Voronoi + 区域生长 + 连通性检查，按单词难度加权 |
| Mock 图片 (mockImage.ts) | ✅ 完成 | 无 API Key 时的心形占位图 |
| 内存缓存 | ✅ 完成 | SHA256 缓存键，避免重复生成 |

### 1.3 数据模型

| 模型 | 状态 | 说明 |
|---|---|---|
| Word / WordGroup / BeadGrid / WordBlock | ✅ TypeScript 类型 | 完整类型定义在 `packages/shared-types` |
| GameState / WordSessionState | ✅ Jotai atoms | 游戏全流程状态机 |
| UserProgress (IndexedDB) | ✅ atomWithStorage | 匿名用户本地持久化 |
| GalleryItem | 🟡 类型定义完成 | 前端类型就绪，后端表未建 |

### 1.4 基础设施

| 项目 | 状态 | 说明 |
|---|---|---|
| Monorepo 结构 | ✅ Turborepo | apps/web + apps/api + packages/shared-types + packages/word-banks |
| Git 仓库 | ✅ 已推送 | https://github.com/HikaruUtadaAlian/PixelWords |
| .gitignore | ✅ 已配置 | node_modules、env、dist 排除 |
| Tailwind + shadcn/ui | ✅ 已集成 | 自定义 wood/cream 按钮变体 |
| Framer Motion | ✅ 已集成 | 页面转场、拼豆解锁、相框组装动画 |

---

## 2. 待实现的模块（按优先级）

### 🔴 P0 — 今天必须完成（背单词需求）

#### 2.1 句子 / 词组拼写系统 (Sentence System)

**需求：** 单词之间穿插优美例句或词组（如 *back up*, *take down*），例句也需要被拼写。

**设计：**
```
会话结构:
  Word 1 → Word 2 → [Phrase/例句] → Word 3 → Word 4 → [Phrase/例句] → ...

例句来源:
  - AI 根据当前组内单词语义实时生成
  - 预置经典例句库（来自词书/名著）
  - 用户自定义收藏

拼写规则:
  - 例句中出现的当前组单词用 **粗体/高亮** 标注
  - 整个例句逐字母输入，空格也要输入
  - 例句解锁一块「连接区域」（bridge block），连接相邻单词块
  - 例句难度 = 长度 / 20，决定解锁的 bead 数量
```

**数据模型扩展：**
```typescript
interface SentenceItem {
  id: string
  text: string                    // 完整例句，如 "The soaring eagle lured us to trek up the steep slope."
  highlightWords: string[]        // 句中包含的本组单词
  translation: string             // 中文翻译
  source?: string                 // 出自哪本书/词书
  difficulty: 'easy' | 'medium' | 'hard'
}

interface WordGroup {
  // ... existing fields
  sentences: SentenceItem[]       // 穿插在本组的例句
  sentenceBlocks: SentenceBlock[] // 例句对应的拼豆区域
}

interface SentenceBlock {
  sentenceId: string
  cells: { x: number; y: number }[]
  connects: [string, string]      // 连接哪两个单词块
}
```

#### 2.2 网格大小可选模式 (Grid Size Options)

**需求：** 目前固定 64×64，后期支持 24×24 / 48×48 / 64×64 / 80×80 可选。

**设计：**
```typescript
type GridSize = 24 | 48 | 64 | 80

// 选择逻辑
- 纯单词模式（无例句）: 24×24 或 48×48
- 单词 + 短例句: 48×48 或 64×64
- 单词 + 长例句/剧情模式: 64×64 或 80×80
- 默认推荐根据单词数量和例句长度自动计算
```

**实现位置：**
- `PracticePage.tsx` 设置面板增加网格选择
- 后端 `image.ts` 已接受 `gridSize` 参数，无需改动
- AI prompt 需根据 gridSize 调整：24×24 → "simplified icon style"；64×64+ → "detailed scene"

### 🟠 P1 — 本周完成

#### 2.3 画廊系统 (Gallery)

- GalleryCard 组件（四种相框风格：wood/metal/gold/minimal）
- GalleryPage 瀑布流布局
- IndexedDB 本地存储 + 可选后端同步
- 分享图片导出（Canvas 合成：相框 + 图片 + 铭牌）

#### 2.4 挑战模式 (Challenge Mode)

- 一次性测试，每词只出现一次
- 正确率 → 解锁比例（80% 正确 → 80% beads 散落解锁）
- 100% 正确才揭示完整图片

#### 2.5 单词银行接入真实数据

- 当前使用 mock 数据（`mocks/words.ts`）
- 需要接入 CET-4/6/GRE 真实词库 JSON
- 后端 PostgreSQL 词库表 + 分页查询

### 🟡 P2 — 近期完成

#### 2.6 剧情系统 (Story Mode)

**核心概念：** 每组单词的例句串联成一个微故事。当全部拼豆解锁后，揭示「完美终结句」。

**设计：**
```
闯关结构:
  ┌─────────────────────────────────────────┐
  │  Chapter 1: "热浪绿洲"                  │
  │  - 7 个单词 + 2 个例句                  │
  │  - 例句 1: The trekker climbed...       │
  │  - 例句 2: A blast of cool scent...     │
  │  - 终结句: At last, the oasis revealed │
  │    itself beyond the steep slope.       │
  │  → 解锁「绿洲」拼豆画                   │
  └─────────────────────────────────────────┘
                      ↓
  ┌─────────────────────────────────────────┐
  │  Chapter 2: "数字工坊"                  │
  │  - 8 个单词 + 2 个例句                  │
  │  - 终结句连接上一章: The craftsman     │
  │    from the oasis brought his heritage  │
  │    into the digital realm.              │
  └─────────────────────────────────────────┘
```

**剧情生成规则：**
1. AI 根据整组单词生成 3-5 个例句，每句包含 2-3 个组内单词
2. 例句之间有叙事连续性
3. 最后一句为「终结句」(climax sentence)，全部解锁后展示
4. 终结句也作为打字挑战——正确输入后触发图片完全揭示 + 相框动画 +  confetti

#### 2.7 词书 / 名著闯关模式 (Book Adventure)

**核心概念：** 一本词书或一部英文名著的生词 → 分成若干章 → 每章一幅象征性拼豆画 → 通关解锁下一章。

**设计：**
```typescript
interface Book {
  id: string
  title: string                    // e.g. "The Great Gatsby"
  author?: string
  coverImage?: string
  chapters: Chapter[]
  totalWords: number
}

interface Chapter {
  id: string
  title: string                    // e.g. "Chapter 3: The Party"
  words: Word[]                    // 本章生词（10-15个）
  sentences: SentenceItem[]        // 出自原著的例句
  climaxSentence: string           // 本章高潮句
  imageTheme: string               // AI 生成提示词主题
  unlockRequirement: {
    prevChapterId?: string
    minAccuracy?: number           // 前一章正确率要求
  }
}

interface PlayerBookProgress {
  bookId: string
  completedChapters: string[]
  currentChapterId: string
  chapterStars: Record<string, 1|2|3>  // 三星评价
}
```

**星级评价：**
- ⭐：完成（全部单词解锁）
- ⭐⭐：完成 + 正确率 ≥ 90%
- ⭐⭐⭐：完成 + 正确率 100% + 无提示完成终结句

**视觉设计：**
- 词书选择页像书架，每本书有封面（AI 生成的象征性小图）
- 章节地图像棋盘游戏路径，每章一个节点
- 未解锁章节显示为灰色剪影，已通关显示彩色

### 🟢 P3 — 未来探索

| 功能 | 说明 |
|---|---|
| 多人竞速 | 两人同组单词，先解锁完图片者胜 |
| 社区画廊 | 用户上传自己的 AI 生成图 + 单词组合 |
| 移动 App | React Native 版本 |
| AI 语音剧情 | 终结句用 AI TTS 朗读，配合 BGM |
| AR 拼豆展示 | 手机摄像头将完成的拼豆画投射到现实桌面 |

---

## 3. 今日单词分组 & AI 拼豆画创意（Unit 4-6）

### Group 1: 「热浪绿洲」— 自然与旅途 (7词)

**单词:** oasis · slope · trek · soaring · steeply · blast · scent

**AI 创意描述:**
> 沙漠中的旅者跋涉(trek)在陡峭(steeply)的沙丘斜坡(slope)上，远方一片绿洲(oasis)棕榈摇曳。一只雄鹰(soaring)在烈日的热区上空盘旋，一阵清爽的blast风带来了绿洲的芬芳(scent)。
>
> **Prompt:** *A pixel-art desert traveler scene: a lone trekker climbing a steep sand dune slope, an oasis with palm trees shimmering in the heat distance, a soaring eagle overhead, a refreshing blast of wind carrying floral scent. Perler bead style, flat solid colors, 8-bit, crisp outlines, vibrant warm palette of gold, teal, and deep orange.*

**例句构思:**
- "After a long **trek** up the **steeply** rising **slope**, the travelers finally saw the **oasis**."
- "A sudden **blast** of wind carried the sweet **scent** of flowers from the **soaring** cliffs above."
- **终结句:** "At the edge of the oasis, where the steep slope met the sky, the soaring eagle dived into a blast of golden wind, and the scent of home filled the air."

---

### Group 2: 「数字工坊」— 科技与创造 (8词)

**单词:** algorithm · immersive · avatar · versatility · agile · craftsmanship · integrate · ergonomic

**AI 创意描述:**
> 戴着VR头显的工匠(craftsmanship)在沉浸式(immersive)数字空间中工作，他的虚拟化身(avatar)敏捷地(agile)操作着全息算法(algorithm)面板。多功能(versatility)机械臂正在整合(integrate)人体工学(ergonomic)设计组件。
>
> **Prompt:** *A pixel-art digital workshop: a craftsman wearing VR headset in an immersive virtual space, his agile avatar manipulating holographic algorithm panels, versatile robotic arms integrating ergonomic design components. Perler bead style, flat solid colors, 8-bit, crisp outlines, neon cyan and warm gold palette.*

**例句构思:**
- "The **craftsmanship** of the **ergonomic** chair showed the **versatility** of modern design."
- "His **agile** **avatar** moved through the **immersive** world, running a complex **algorithm**."
- **终结句:** "With agile craftsmanship, the avatar integrated ergonomic precision into an immersive algorithm of endless versatility."

---

### Group 3: 「千年集市」— 商业与文化 (7词)

**单词:** influx · accommodation · high season · sustain · across the board · restock · heritage

**AI 创意描述:**
> 热闹的古集市，游客涌入(influx)，住宿(accommodation)招牌林立。旺季(high season)的喧嚣中，商人们全面(across the board)补货(restock)，传统遗产(heritage)摊位与现代商品并存，维持(sustain)着古老集市的活力。
>
> **Prompt:** *A pixel-art ancient bazaar marketplace: crowds influx through arched gates, accommodation signs hanging above, high season bustle with merchants restocking across the board, heritage stalls beside modern goods. Perler bead style, flat solid colors, 8-bit, warm earth tones with colorful market accents.*

**例句构思:**
- "The **influx** of tourists during **high season** forced hotels to **restock** supplies **across the board**."
- "The town's cultural **heritage** helps **sustain** its economy through careful **accommodation** of visitors."
- **终结句:** "As high season brought its influx across the board, the heritage market chose to restock not goods, but dreams, to sustain the soul of the town."

---

### Group 4: 「失衡天平」— 变化与选择 (8词)

**单词:** speculative · out of kilter · lure · magnify · density · appeal · disposal · priority

**AI 创意描述:**
> 一个巨大的天平，一边堆满了诱惑(lure)、放大的(magnify)金币和投机(speculative)泡沫，密度(density)极高；另一边是处理(disposal)和优先(priority)秩序，但天平已经失调(out of kilter)，向贪婪一侧倾斜。
>
> **Prompt:** *A pixel-art giant unbalanced scale: one side piled with lure coins magnified to giant size, speculative bubbles, high density gold; the other side has disposal bins and priority order weights, but the scale is out of kilter tilting toward greed. Perler bead style, flat solid colors, 8-bit, dramatic red and deep blue contrast.*

**例句构思:**
- "The **speculative** market was **out of kilter**, its **density** of risk hard to **dispose** of."
- "Ads **magnify** the **appeal** of products to **lure** buyers who lack clear **priorities**."
- **终结句:** "When the speculative lure magnified out of kilter, the density of illusion demanded disposal, and only the appeal of truth remained a priority."

---

### Group 5: 「破晓宣言」— 觉醒与变革 (6词)

**单词:** unveil · self-sufficiency · tremendously · drastic · consensus · hotspot

**AI 创意描述:**
> 黎明时分，帷幕揭开(unveil)，一轮巨大的太阳剧变(drastically)升起。自给自足(self-sufficiency)的社区达成共识(consensus)，将热点(hotspot)问题设为优先。光芒 tremendously 照亮大地。
>
> **Prompt:** *A pixel-art dawn revelation scene: curtains unveiling to reveal a drastically rising sun, a self-sufficient village community reaching consensus around a glowing hotspot monument. Tremendous golden light floods the landscape. Perler bead style, flat solid colors, 8-bit, golden dawn palette with deep purple shadows.*

**例句构思:**
- "The village reached a **consensus** to **unveil** a **drastic** plan for **self-sufficiency**."
- "The **hotspot** of innovation grew **tremendously** after they chose self-sufficiency."
- **终结句:** "With tremendous consensus, the community unveiled a drastic truth: self-sufficiency is the only hotspot that never fades."

---

## 4. 技术栈更新清单

### 前端新增依赖（预计）
```json
{
  "html2canvas": "^1.4.1",      // GalleryCard 导出为图片
  "canvas-confetti": "^1.9.3",   // 通关庆祝
  "fuse.js": "^7.0.0",           // 词库模糊搜索
  "jszip": "^3.10.1"             // 批量导出学习记录
}
```

### 后端新增依赖（预计）
```json
{
  "@anthropic-ai/sdk": "^0.24.0",  // 剧情/例句生成（Claude）
  "node-cron": "^3.0.3"             // 每日复习提醒
}
```

---

## 5. 数据流更新

```
[用户选择词书/单元]
        ↓
[系统分组单词] ──→ [AI 生成：图片 + 例句 + 终结句]
        ↓                           ↓
[图片管线：64×64 量化]      [例句注入 WordGroup]
        ↓                           ↓
[分块：单词块 + 例句连接块] ←──┘
        ↓
[用户打字解锁] ──→ [单词块逐个解锁]
        ↓
[例句穿插打字] ──→ [连接块解锁，拼豆画渐趋完整]
        ↓
[全部解锁] ──→ [终结句打字挑战]
        ↓
[输入终结句] ──→ [图片完全揭示 + 相框组装 + confetti]
        ↓
[保存至画廊] ──→ [解锁下一章/组]
```

---

## 6. 64×64 网格下 bead 数量估算

| 场景 | 单词数 | 例句数 | 总块数 | 每块平均 beads |
|---|---|---|---|---|
| 纯单词模式 | 8 | 0 | 8 | 512 |
| 单词+短例句 | 7 | 2 | 9 | ~455 |
| 单词+长例句/剧情 | 6 | 3 | 10 | ~410 |
| 极限（含连接桥块）| 10 | 4 | 15 | ~273 |

64×64 = 4,096 beads。在 Canvas 2D 下，现代浏览器可轻松维持 60fps。

---

## 7. 下一步行动清单

1. **✅ 完成** — 仓库移至桌面，gridSize 48→64
2. **今日** — 实现 SentenceItem 类型 + 例句穿插打字逻辑
3. **今日** — 为 Unit 4-6 生成第一组真实 AI 拼豆画
4. **本周** — GalleryCard + GalleryPage
5. **本周** — 挑战模式
6. **下周** — 剧情系统原型（例句串联 + 终结句）
7. **下下周** — 词书闯关模式框架
