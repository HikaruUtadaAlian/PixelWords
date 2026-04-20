# PixelWords / 拼豆单词 — 视觉系统 & UI 规范

## 1. 设计哲学

PixelWords 将实体拼豆（Perler Bead）手工的温存质感，与现代背单词应用的专注体验相融合。情绪弧线：**期待**（隐藏底板）→ **沉浸**（打字节奏）→ **惊喜**（拼豆弹入、图片揭示）→ **成就**（裱框入画廊）。

**核心原则：**
- **手工数字感**：拼豆必须有实体感——圆润、光泽、微微凸起。
- **专注优先**：打字面板是绝对主角，其余元素不抢注意力。
- **即时奖赏**：每次正确输入都要肉眼可见——弹珠、色块绽放、相框组装。
- **双语平等**：中英文不是翻译关系，是并列共存。

---

## 2. 色彩系统

### 2.1 语义色板（CSS Variables）

```css
:root {
  /* === 基础 === */
  --background: 40 33% 94%;          /* #F5F5DC 米白底板 */
  --foreground: 25 45% 18%;          /* #3D2914 深棕文字 */
  --card: 40 30% 96%;                /* #FAF8F0 卡片底色 */
  --card-foreground: 25 45% 18%;
  --popover: 40 30% 98%;
  --popover-foreground: 25 45% 18%;

  /* === 主色 — 马鞍棕/木色（温暖、手工、沉稳）=== */
  --primary: 25 76% 31%;             /* #8B4513 */
  --primary-foreground: 40 33% 94%;
  --primary-hover: 25 76% 26%;       /* #753A10 */
  --primary-muted: 25 40% 90%;       /* #E8D5C4 */

  /* === 辅色 — 暖米色（柔和、背景区分）=== */
  --secondary: 35 30% 85%;           /* #D9CFC0 */
  --secondary-foreground: 25 45% 18%;
  --secondary-muted: 35 25% 93%;     /* #F0EBE3 */

  /* === 点缀 — 珊瑚橙（成就、庆祝、强调）=== */
  --accent: 15 85% 55%;              /* #E87040 */
  --accent-foreground: 0 0% 100%;

  /* === 错误/危险 === */
  --destructive: 0 65% 50%;          /* #D04040 */
  --destructive-foreground: 0 0% 100%;
  --destructive-muted: 0 50% 95%;    /* #FCEAEA */

  /* === 成功 === */
  --success: 145 50% 40%;            /* #33A060 */
  --success-foreground: 0 0% 100%;
  --success-muted: 145 40% 93%;      /* #E6F5ED */

  /* === 弱化文字 === */
  --muted: 30 15% 82%;               /* #D4CFC7 */
  --muted-foreground: 25 15% 45%;    /* #7D6E5D */

  /* === 边框 & 聚焦环 === */
  --border: 30 20% 78%;              /* #D1C9BC */
  --input: 30 20% 78%;
  --ring: 25 76% 31%;                /* 同主色 */

  /* === 拼豆底板色（pegboard）=== */
  --bead-plate: 40 25% 90%;          /* #E8E2D4 未解锁底板 */
  --bead-plate-shadow: 40 15% 80%;   /* #CFC8B8 底板阴影 */

  /* === 相框 === */
  --frame-wood: 25 55% 35%;          /* #8B5A2B 木质 */
  --frame-metal: 220 5% 70%;         /* #B0B3B8 金属银 */
  --frame-gold: 43 70% 50%;          /* #D4A843 金色 */
  --frame-minimal: 0 0% 100%;        /* 白色极简 */

  /* === 圆角 === */
  --radius: 0.5rem;                  /* 8px — 拼豆相关组件 */
  --radius-sm: 0.25rem;              /* 4px */
  --radius-lg: 0.75rem;              /* 12px — 卡片 */
  --radius-xl: 1rem;                 /* 16px */
  --radius-full: 9999px;
}
```

### 2.2 暗色模式（可选 V1.1）

```css
.dark {
  --background: 25 20% 10%;          /* #1F1812 */
  --foreground: 35 25% 88%;          /* #E8E0D4 */
  --card: 25 18% 14%;                /* #2A221A */
  --card-foreground: 35 25% 88%;

  --primary: 25 60% 45%;             /* #B5651D */
  --primary-muted: 25 25% 20%;

  --muted: 25 12% 22%;
  --muted-foreground: 30 12% 55%;

  --border: 25 12% 25%;
  --input: 25 12% 25%;

  --bead-plate: 25 12% 18%;          /* #2E2620 */
  --bead-plate-shadow: 25 10% 12%;   /* #211C18 */
}
```

### 2.3 拼豆实体色板（17 色）

来源于真实 Hama/Perler 拼豆颜色。每颗拼豆渲染时需叠加：顶部高光 + 底部阴影 + 中心微凹。

| Token | Hex | 中文名 | 典型意象 |
|---|---|---|---|
| `bead-white` | `#FFFFFF` | 白 | 高光、云朵 |
| `bead-yellow` | `#F4D03F` | 黄 | 阳光、星星 |
| `bead-red` | `#E74C3C` | 红 | 爱心、危险 |
| `bead-green` | `#2ECC71` | 绿 | 草地、通过 |
| `bead-blue` | `#3498DB` | 蓝 | 天空、海洋 |
| `bead-purple` | `#9B59B6` | 紫 | 神秘、魔法 |
| `bead-orange` | `#E67E22` | 橙 | 火焰、活力 |
| `bead-teal` | `#1ABC9C` | 青 | 水面、宝石 |
| `bead-dark-blue` | `#34495E` | 深蓝 | 深夜、深海 |
| `bead-gray` | `#95A5A6` | 灰 | 石头、中性 |
| `bead-dark-orange` | `#D35400` | 深橙 | 泥土、木材 |
| `bead-dark-red` | `#C0392B` | 深红 | 血液、玫瑰 |
| `bead-dark-green` | `#27AE60` | 深绿 | 森林、深叶 |
| `bead-dark-purple` | `#8E44AD` | 深紫 | 皇室、夜幕 |
| `bead-gold` | `#F39C12` | 金 | 宝藏、奖杯 |
| `bead-silver` | `#BDC3C7` | 银 | 金属、科技 |
| `bead-charcoal` | `#7F8C8D` | 炭灰 | 阴影、轮廓 |

**拼豆 3D 渲染规范（Canvas 2D）：**

```typescript
function drawBead(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, isUnlocked: boolean) {
  const r = size * 0.42;           // 拼豆半径（留 8% 间隙模拟网格线）
  const cx = x + size / 2;
  const cy = y + size / 2;
  const corner = size * 0.15;      // 圆角

  if (!isUnlocked) {
    // 未解锁：纯平面米色底板格
    ctx.fillStyle = 'hsl(var(--bead-plate))';
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, size - 2, size - 2, corner);
    ctx.fill();
    return;
  }

  // 1. 底部投影（制造悬浮感）
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 3, size - 2, size - 2, corner);
  ctx.fill();

  // 2. 主体色块
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, size - 2, size - 2, corner);
  ctx.fill();

  // 3. 顶部高光 — 1px 白色半透明线
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 2.5);
  ctx.lineTo(x + size - 3, y + 2.5);
  ctx.stroke();

  // 4. 底部阴影 — 2px 深色半透明
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + size - 2);
  ctx.lineTo(x + size - 3, y + size - 2);
  ctx.stroke();

  // 5. 中心微凹 — 径向渐变（从中心略暗到边缘正常）
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.65);
  grad.addColorStop(0, 'rgba(0,0,0,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // 6. 边缘提亮（模拟圆润倒角）
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(x + 1.5, y + 1.5, size - 3, size - 3, corner * 0.8);
  ctx.stroke();
}
```

---

## 3. 字体系统

| 层级 | 字体 | 字重 | 大小 | 行高 | 字间距 |
|---|---|---|---|---|---|
| Display / Logo | LXGW WenKai / 霞鹜文楷 | 700 | 2rem (32px) | 1.2 | -0.01em |
| H1 | LXGW WenKai | 700 | 1.75rem (28px) | 1.3 | 0 |
| H2 | LXGW WenKai | 600 | 1.375rem (22px) | 1.4 | 0 |
| H3 | LXGW WenKai | 600 | 1.125rem (18px) | 1.5 | 0 |
| 正文 | Inter / 系统黑体 | 400 | 1rem (16px) | 1.7 | 0 |
| 正文小 | Inter | 400 | 0.875rem (14px) | 1.6 | 0 |
| 标注 | Inter | 500 | 0.75rem (12px) | 1.5 | 0.01em |
| 打字区（单词） | JetBrains Mono | 700 | 3rem (48px) | 1.2 | 0.06em |
| 打字区（音标） | JetBrains Mono | 400 | 0.875rem (14px) | 1.4 | 0 |

**字体栈配置：**
```js
// tailwind.config.js
fontFamily: {
  sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
  display: ['LXGW WenKai', 'Inter', 'PingFang SC', 'serif'],
  mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
}
```

> **注意**：霞鹜文楷通过 CDN 引入（`@chinese-fonts/lxgwwenkai`）或本地 woff2。若加载失败，回退到 PingFang SC / Microsoft YaHei。

---

## 4. 间距与布局

### 4.1 间距标度

| Token | 值 | 用途 |
|---|---|---|
| `space-1` | 4px | 图标间隙、紧凑内边距 |
| `space-2` | 8px | 行内间隙 |
| `space-3` | 12px | 组件内部间距 |
| `space-4` | 16px | 默认间隙、卡片内边距 |
| `space-5` | 20px | 区块内部 |
| `space-6` | 24px | 区块之间 |
| `space-8` | 32px | 大区块分隔 |
| `space-10` | 40px | 页面级内边距 |
| `space-12` | 48px | Hero 区域 |

### 4.2 页面布局网格

- **最大内容宽度**：1280px
- **页面内边距**：`px-4 sm:px-6 lg:px-10`

**练习页（PracticePage）桌面端布局：**
```
≥1024px:
┌──────────────────────────────────────────────┐
│  Header (Logo + 模式切换 + 设置)              │  h-16
├────────────────────────┬─────────────────────┤
│                        │                     │
│   BeadBoard            │   WordInput Panel   │
│   (60%, max 600px)     │   (40%)             │
│   带木纹边框            │   单词/音标/释义    │
│                        │   输入框            │
│                        │   进度条            │
│                        │   统计信息          │
│                        │                     │
├────────────────────────┴─────────────────────┤
│  ThemeHint Bar（窄条，意境提示）              │
└──────────────────────────────────────────────┘
```

**移动端布局（<1024px）：**
全宽垂直堆叠。拼豆板置顶，控制面板在下方。

### 4.3 拼豆板尺寸响应

```
Mobile (<640px):   min(100vw - 32px, 360px)
Tablet (640–1023px): 440px
Desktop (≥1024px):   520px
Large (≥1280px):     600px
```

---

## 5. 组件设计规范

### 5.1 BeadBoard（拼豆板）

**外框容器：**
- 背景：`var(--bead-plate)` 叠加木纹纹理
- 边框：8px solid `var(--frame-wood)`（模拟木质相框底板）
- 圆角：`var(--radius-lg)`（12px）
- 内边距：`space-3`（12px）
- 阴影：`4px 6px 0px hsl(25 45% 18% / 0.08), 8px 12px 24px hsl(25 45% 18% / 0.06)`（手工感偏移阴影）

**底板纹理（CSS）：**
```css
.bead-board-frame {
  background-color: hsl(var(--bead-plate));
  background-image:
    radial-gradient(circle at center, hsl(var(--bead-plate-shadow)) 0px, hsl(var(--bead-plate-shadow)) 1.5px, transparent 1.5px),
    url("/textures/wood-grain-subtle.png");  /* 可选 subtle 木纹 */
  background-size: 10px 10px, 200px auto;
  border: 8px solid hsl(25 55% 35%);
  border-radius: 12px;
  box-shadow:
    4px 6px 0px rgba(61, 41, 20, 0.08),
    8px 12px 24px rgba(61, 41, 20, 0.06),
    inset 0 1px 2px rgba(255,255,255,0.3);  /* 内高光 */
}
```

**Canvas 渲染区：**
- 填充容器减去 padding
- 拼豆间隙 1px（底板色透出 = 网格线）
- Retina 屏使用 `devicePixelRatio` 缩放

**状态样式：**
| 状态 | 视觉 |
|---|---|
| 全部未解锁 | 所有格子显示平面米色底板色 |
| 部分解锁 | 拼豆逐个弹入，带 spring 动画 |
| 全部解锁 | 底板渐隐，原图渐显 |
| Hover（桌面） | 鼠标处拼豆高亮一圈柔和光晕 |

---

### 5.2 WordInput（打字控制面板）

**容器卡片：**
- 背景：`var(--card)`
- 边框：1px solid `var(--border)`
- 圆角：`var(--radius-xl)`（16px）
- 内边距：`space-6`（24px）
- 阴影：`0 2px 0px hsl(25 45% 18% / 0.04), 0 4px 16px hsl(25 45% 18% / 0.03)`

**当前单词区：**
- 字体：`font-mono font-bold text-5xl`
- 颜色：`var(--foreground)`
- 字间距：`tracking-widest`
- 居中对齐

**音标：**
- 字体：`font-mono text-sm`
- 颜色：`hsl(var(--muted-foreground))`
- 位于单词正下方，间距 `space-2`

**中文释义：**
- 字体：`font-display text-lg font-medium`
- 颜色：`hsl(var(--primary))`
- 位于音标下方，间距 `space-3`

**输入反馈色：**
| 状态 | 字母颜色 | 背景闪烁 |
|---|---|---|
| 输入中（正确） | `hsl(var(--success))` | 无 |
| 输入错误 | `hsl(var(--destructive))` | `var(--destructive-muted)` 200ms 闪烁 |
| 单词完成 | `hsl(var(--success))` | `var(--success-muted)` 300ms 脉冲 |

**进度条（Mastery Bar）：**
- 高度：10px
- 背景：`hsl(var(--muted))`
- 填充：`hsl(var(--primary))`
- 圆角：`var(--radius-full)`
- **拼豆风格**：进度条内部可加入微小圆点纹理，或分段显示（每完成一次显示一颗小豆子）
- 过渡：`transition-all duration-500 ease-out`

**错误抖动：**
```typescript
const shakeVariants = {
  shake: {
    x: [0, -10, 10, -7, 7, -4, 4, 0],
    transition: { duration: 0.45 },
  },
};
```

---

### 5.3 GalleryCard（裱框卡片）

**四种相框风格：**

| 风格 | 边框 | 背景/纹理 | 铭牌 |
|---|---|---|---|
| **Wood** 木质 | 14px 深棕色 | `var(--frame-wood)` + 木纹纹理 | 木质铭牌，凹刻文字 |
| **Metal** 金属 | 6px 银灰 | `var(--frame-metal)` + 金属拉丝渐变 | 金属铭牌，细边框 |
| **Gold** 金色 | 18px 金色 | `linear-gradient(135deg, #D4A843, #B8952E)` + 暗纹 | 金色铭牌，复古字体 |
| **Minimal** 极简 | 2px 白色 | 纯白，无纹理 | 无铭牌，信息直接印在底部 |

**卡片整体结构：**
```
┌─────────────────────────────┐  ← 外边框（根据风格）
│  ┌─────────────────────┐    │
│  │                     │    │  ← 内边距 8–16px
│  │   [揭示后的图片]     │    │
│  │                     │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  📅 2024.06.15      │    │  ← 铭牌 plaque
│  │  ⏱ 4分32秒 | 30词   │    │
│  │  🏆 准确率 96%       │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
     ↓ 墙面投影（柔和、略偏移）
```

**铭牌样式（Plaque）：**
- 背景：比相框略深的同色系
- 圆角：`var(--radius)`（8px）
- 内边距：`space-3`（12px）
- 字体：`font-display text-sm`
- 文字颜色：米色/白色，视相框深浅而定

**Hover 效果：**
- 整体放大：`scale(1.03)`
- 阴影加深：`0 12px 32px rgba(61,41,20,0.15)`
- 铭牌信息从底部滑入显示（若平时隐藏）

**Framer Motion 相框组装动画：**
```typescript
const frameAssembly = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const framePiece = {
  hidden: (dir: string) => ({
    opacity: 0,
    x: dir === 'left' ? -40 : dir === 'right' ? 40 : 0,
    y: dir === 'top' ? -40 : dir === 'bottom' ? 40 : 0,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};
```

---

### 5.4 ThemeHint Bar（主题提示栏）

**容器：**
- 背景：`hsl(var(--primary-muted))`
- 左边框：4px solid `hsl(var(--primary))`
- 右边圆角：`var(--radius)`
- 内边距：`space-4`（16px）
- 位置：页面底部固定窄条

**内容：**
- 标签："AI 构思" / "Theme" — `text-xs font-semibold uppercase tracking-wider text-primary`
- 正文：意境描述 — `text-sm text-foreground`
- 图标：Sparkles（✨）右上角

---

### 5.5 Navigation Header

**布局：**
- 高度：64px
- 背景：`hsl(var(--background))`，滚动后加 `backdrop-blur-md`
- 下边框：1px solid `hsl(var(--border))`（滚动 16px 后出现）

**元素：**
- 左侧：Logo "拼豆单词"（霞鹜文楷，bold，带 4 色拼豆图标 24×24px）
- 中间：模式切换标签（练习 / 挑战 / 画廊）— pill 形状，激活态 `bg-primary text-primary-foreground rounded-full`
- 右侧：设置齿轮 + 主题切换

---

## 6. 页面布局详设

### 6.1 PracticePage（练习模式）

```tsx
// 结构示意
<div className="min-h-screen bg-background">
  <Header />

  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 左侧：拼豆板 */}
      <div className="w-full lg:w-[58%] flex justify-center">
        <BeadBoard
          gridSize={20}
          className="w-full max-w-[600px] aspect-square"
        />
      </div>

      {/* 右侧：控制面板 */}
      <div className="w-full lg:w-[38%] flex flex-col gap-5">
        {/* 单词卡片 */}
        <Card className="rounded-xl p-6">
          <div className="text-center">
            <div className="font-mono text-5xl font-bold tracking-widest">{currentWord.name}</div>
            <div className="font-mono text-sm text-muted-foreground mt-2">{currentWord.usphone}</div>
            <div className="font-display text-lg text-primary mt-3">{currentWord.trans.join('；')}</div>
          </div>
        </Card>

        {/* 输入区 */}
        <Card className="rounded-xl p-6">
          <input
            className="w-full text-center font-mono text-3xl bg-transparent border-b-2 border-border focus:border-primary outline-none py-3 transition-colors"
            autoFocus
          />
          {/* 实时字母反馈 */}
          <div className="flex justify-center gap-1 mt-4">
            {letters.map((l, i) => (
              <span key={i} className={cn(
                "font-mono text-2xl font-bold transition-colors",
                l.status === 'correct' && "text-success",
                l.status === 'wrong' && "text-destructive",
              )}>
                {l.char}
              </span>
            ))}
          </div>
        </Card>

        {/* 进度条 */}
        <Card className="rounded-xl p-5">
          <div className="flex justify-between text-sm mb-2">
            <span>单词进度</span>
            <span>{unlockedCount} / {totalWords}</span>
          </div>
          <Progress value={(unlockedCount / totalWords) * 100} className="h-2.5" />
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Timer} label="用时" value={elapsedTime} />
          <StatCard icon={Target} label="准确率" value={`${accuracy}%`} />
          <StatCard icon={BookOpen} label="剩余" value={remainingWords} />
        </div>
      </div>
    </div>
  </main>

  {/* 底部主题提示 */}
  <ThemeHintBar explanation={themeExplanation} />
</div>
```

### 6.2 GalleryPage（画廊页）

**布局：Masonry 瀑布流**

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
  <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
    {galleryItems.map(item => (
      <div key={item.id} className="break-inside-avoid mb-6">
        <GalleryCard
          imageUrl={item.imageUrl}
          frameStyle={item.frameStyle}
          plaque={{
            date: item.completedAt,
            elapsedTime: item.elapsedTimeMs,
            wordCount: item.words.length,
            accuracy: item.accuracy,
          }}
          onClick={() => openDetailDialog(item)}
        />
      </div>
    ))}
  </div>
</div>
```

**GalleryCard Hover：**
- `scale(1.03)`
- 阴影从 `0 4px 12px rgba(61,41,20,0.06)` → `0 16px 40px rgba(61,41,20,0.12)`
- 遮罩层淡入（`bg-black/20`），中央显示 "查看详情" 按钮

**大图 Dialog：**
- 圆角：`var(--radius-xl)`（16px）
- 遮罩：`bg-black/60 backdrop-blur-sm`
- 内容：原尺寸图片 + 完整铭牌信息 + 删除/分享按钮
- 进入动画：`scale(0.9) opacity(0)` → `scale(1) opacity(1)`，300ms

### 6.3 SettingsPage（设置页）

**布局：居中卡片式**

```tsx
<div className="max-w-xl mx-auto px-4 py-10">
  <Card className="rounded-xl p-8">
    <h1 className="font-display text-2xl font-bold mb-8">设置</h1>

    {/* 词库选择 */}
    <div className="mb-6">
      <label className="text-sm font-medium mb-2 block">词库</label>
      <Select>
        <SelectItem value="cet4">CET-4 四级词汇</SelectItem>
        <SelectItem value="cet6">CET-6 六级词汇</SelectItem>
        <SelectItem value="gre">GRE 词汇</SelectItem>
        <SelectItem value="custom">自定义词库</SelectItem>
      </Select>
    </div>

    {/* 网格大小 */}
    <div className="mb-6">
      <label className="text-sm font-medium mb-2 block">拼豆网格大小</label>
      <div className="flex gap-3">
        {['20×20', '30×30', '50×50', '100×100'].map(size => (
          <ToggleButton
            key={size}
            active={gridSize === size}
            className="px-4 py-2 rounded-lg border border-border hover:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground">
            {size}
          </ToggleButton>
        ))}
      </div>
    </div>

    {/* 主题策略偏好 */}
    <div className="mb-6">
      <label className="text-sm font-medium mb-2 block">AI 主题偏好</label>
      <Select>
        <SelectItem value="random">🎲 随机</SelectItem>
        <SelectItem value="allusion">📜 典故</SelectItem>
        <SelectItem value="quote">💬 名言</SelectItem>
        <SelectItem value="nature">🌿 自然/生活</SelectItem>
      </Select>
    </div>

    {/* 声音开关 */}
    <div className="flex items-center justify-between py-3 border-t border-border">
      <div className="flex items-center gap-3">
        <Volume2 className="w-5 h-5 text-muted-foreground" />
        <span>音效</span>
      </div>
      <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
    </div>
  </Card>
</div>
```

---

## 7. 动效规范（Framer Motion）

### 7.1 时间令牌

| Token | 值 | 用途 |
|---|---|---|
| `duration-instant` | 100ms | Hover 态、微反馈 |
| `duration-fast` | 200ms | 颜色变化、透明度、页面转场 |
| `duration-normal` | 300ms | 过渡、面板展开 |
| `duration-slow` | 500ms | 重大揭示、相框组装 |
| `duration-dramatic` | 800ms | 图片揭示 |
| `easing-default` | `[0.4, 0, 0.2, 1]` | 标准 ease |
| `easing-bounce` | `[0.34, 1.56, 0.64, 1]` | 弹珠感（拼豆解锁） |
| `easing-decelerate` | `[0, 0, 0.2, 1]` | 元素进入 |

### 7.2 拼豆解锁动效

```typescript
const beadUnlockVariants = {
  hidden: {
    scale: 0.3,
    opacity: 0,
    filter: 'brightness(2)',
  },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    filter: 'brightness(1)',
    transition: {
      delay: i * 0.025,              // 25ms 逐个 stagger
      duration: 0.35,
      ease: [0.34, 1.56, 0.64, 1],   // ease-out-bounce
    },
  }),
};
```

**发光效果：**
解锁瞬间拼豆亮度从 200% 衰减到 100%，制造"闪光点"。

### 7.3 图片揭示动效

```typescript
const imageRevealVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0, 0, 0.2, 1],          // decelerate
    },
  },
};

const beadFadeVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 0,
    transition: { duration: 0.6, delay: 0.2 },
  },
};
```

**揭示序列：**
1. **0ms** — 剩余拼豆快速解锁（stagger 8ms）
2. **400ms** — 拼豆层 opacity 渐隐至 0
3. **400ms** — 原图从中心放大进入（scale 0.85→1）
4. **1000ms** — 相框边框从四边滑入组装

### 7.4 相框组装动效

```typescript
const frameAssembly = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.6 },
  },
};

const frameBorder = {
  hidden: (side: 'top' | 'bottom' | 'left' | 'right') => {
    const map = {
      top: { y: -30, x: 0 },
      bottom: { y: 30, x: 0 },
      left: { x: -30, y: 0 },
      right: { x: 30, y: 0 },
    };
    return { opacity: 0, ...map[side] };
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { type: 'spring', stiffness: 250, damping: 22 },
  },
};
```

### 7.5 页面转场

```typescript
const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.15 },
  },
};
```

### 7.6 减少动效（Reduced Motion）

尊重 `prefers-reduced-motion`：
- 拼豆解锁：禁用 spring，改为淡入（opacity 0→1，150ms）
- 禁用 confetti
- 页面转场：仅淡入淡出，无位移
- 保留功能性颜色过渡

---

## 8. shadcn/ui 主题定制

### 8.1 globals.css 变量映射

```css
@layer base {
  :root {
    --background: 40 33% 94%;
    --foreground: 25 45% 18%;
    --card: 40 30% 96%;
    --card-foreground: 25 45% 18%;
    --popover: 40 30% 98%;
    --popover-foreground: 25 45% 18%;
    --primary: 25 76% 31%;
    --primary-foreground: 40 33% 94%;
    --secondary: 35 30% 85%;
    --secondary-foreground: 25 45% 18%;
    --muted: 30 15% 82%;
    --muted-foreground: 25 15% 45%;
    --accent: 15 85% 55%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 65% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 30 20% 78%;
    --input: 30 20% 78%;
    --ring: 25 76% 31%;
    --radius: 0.5rem;
  }
}
```

### 8.2 Button 变体扩展

```tsx
// components/ui/button.tsx 新增变体
const buttonVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        wood: "bg-[#8B5A2B] text-[#F5F5DC] shadow-[0_2px_0_#5C3A1B] hover:bg-[#7A4E25] active:shadow-none active:translate-y-[2px]",
        cream: "bg-[#F0EBE3] text-[#3D2914] border border-[#D1C9BC] shadow-sm hover:bg-[#E8E2D4]",
        ghost: "hover:bg-primary-muted hover:text-primary",
        outline: "border border-input bg-background hover:bg-primary-muted hover:text-primary",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-8 px-3 text-sm rounded-md",
        lg: "h-12 px-6 text-lg rounded-xl",
        icon: "h-10 w-10 rounded-lg",
      },
    },
  }
);
```

> `wood` 变体：深棕底色 + 米色文字 + 底部 2px 硬阴影模拟木块凸起，点击时 shadow 消失并下移 2px，模拟按下。

### 8.3 Card 内阴影底板感

```css
/* 在 card 基础样式上追加 */
.data-[variant=plate]: {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-lg);
  box-shadow:
    inset 0 1px 2px rgba(255,255,255,0.5),
    inset 0 -1px 2px rgba(0,0,0,0.03),
    0 2px 0px hsl(25 45% 18% / 0.04),
    0 4px 16px hsl(25 45% 18% / 0.03);
}
```

### 8.4 Progress 拼豆分段风格

```tsx
// 在 Progress 基础上定制
<Progress
  value={progress}
  className="h-3 bg-muted rounded-full overflow-hidden"
>
  {/* 进度条内加入细微分段线 */}
  <div className="h-full bg-primary relative"
    style={{ width: `${progress}%` }}
  >
    {/* 每 10% 一颗虚拟拼豆分隔 */}
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        className="absolute top-0 bottom-0 w-0.5 bg-primary-hover/30"
        style={{ left: `${i * 10}%` }}
      />
    ))}
  </div>
</Progress>
```

### 8.5 Dialog 圆角 + 柔和遮罩

```css
[data-state="open"] > [data-radix-dialog-overlay] {
  background: hsl(25 45% 18% / 0.5);
  backdrop-filter: blur(4px);
}

[data-radix-dialog-content] {
  border-radius: var(--radius-xl);
  box-shadow:
    0 0 0 1px hsl(var(--border)),
    0 20px 40px -12px hsl(25 45% 18% / 0.2);
}
```

---

## 9. 无障碍设计

### 9.1 对比度

- 正文文字与背景：≥ 4.5:1
- `--foreground` on `--background`：~ 8.5:1 ✓
- `--primary` on white：~ 5.2:1 ✓
- `--muted-foreground` on `--background`：~ 4.8:1 ✓

### 9.2 焦点状态

- 所有可交互元素有 2px `ring`（`hsl(var(--ring))`）
- 焦点环偏移：2px
- 拼豆板焦点：选中拼豆显示方形外框（避免圆环视觉混淆）

### 9.3 屏幕阅读器

- 拼豆板：`role="img"`，`aria-label="拼豆画板，30 词中已解锁 12 个"`
- 单词解锁：`aria-live="polite"` 播报"某某单词已解锁"
- 打字反馈：`aria-live="assertive"` 播报"正确"/"错误"

### 9.4 键盘导航

- `Tab` 循环：模式标签 → 拼豆板 → 输入区 → 设置
- 空格/回车 在拼豆上：朗读颜色与所属单词（辅助功能）
- 输入区自动聚焦新单词

---

## 10. Z-Index 层级

| 层级 | Z-Index | 元素 |
|---|---|---|
| 基础 | 0 | 页面内容 |
| 吸顶 | 10 | 滚动后的 Header |
| 浮层 | 20 | Modal、Dialog |
| 弹出 | 30 | Dropdown、Tooltip |
| 通知 | 40 | Toast |
| 庆祝 | 50 | Confetti 粒子 |

---

## 11. Tailwind Config 扩展

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bead: {
          white: '#FFFFFF',
          yellow: '#F4D03F',
          red: '#E74C3C',
          green: '#2ECC71',
          blue: '#3498DB',
          purple: '#9B59B6',
          orange: '#E67E22',
          teal: '#1ABC9C',
          'dark-blue': '#34495E',
          gray: '#95A5A6',
          'dark-orange': '#D35400',
          'dark-red': '#C0392B',
          'dark-green': '#27AE60',
          'dark-purple': '#8E44AD',
          gold: '#F39C12',
          silver: '#BDC3C7',
          charcoal: '#7F8C8D',
        },
        wood: {
          DEFAULT: '#8B5A2B',
          light: '#A67B5B',
          dark: '#6B4226',
        },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
        display: ['LXGW WenKai', 'Inter', 'PingFang SC', 'serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      animation: {
        'bead-pop': 'beadPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'shake': 'shake 0.45s ease-in-out',
        'fade-in': 'fadeIn 0.35s ease-out',
        'frame-slide': 'frameSlide 0.5s cubic-bezier(0, 0, 0.2, 1) forwards',
      },
      keyframes: {
        beadPop: {
          '0%': { transform: 'scale(0.3)', opacity: '0', filter: 'brightness(2)' },
          '60%': { transform: 'scale(1.15)', opacity: '1', filter: 'brightness(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'brightness(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-10px)' },
          '30%': { transform: 'translateX(10px)' },
          '45%': { transform: 'translateX(-7px)' },
          '60%': { transform: 'translateX(7px)' },
          '75%': { transform: 'translateX(-3px)' },
          '90%': { transform: 'translateX(3px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        frameSlide: {
          '0%': { opacity: '0', transform: 'var(--slide-from)' },
          '100%': { opacity: '1', transform: 'translate(0, 0)' },
        },
      },
      boxShadow: {
        'handmade': '4px 6px 0px rgba(61, 41, 20, 0.08), 8px 12px 24px rgba(61, 41, 20, 0.06)',
        'handmade-hover': '6px 8px 0px rgba(61, 41, 20, 0.1), 12px 16px 32px rgba(61, 41, 20, 0.08)',
        'bead-3d': '0 2px 0px rgba(0,0,0,0.12), inset 0 1px 0px rgba(255,255,255,0.4)',
        'wood-button': '0 2px 0px #5C3A1B',
        'plate-inner': 'inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.03)',
      },
    },
  },
};
```

---

## 12. 所需资源清单

| 资源 | 格式 | 说明 |
|---|---|---|
| 霞鹜文楷字体 | woff2 / CDN | `@chinese-fonts/lxgwwenkai` |
| JetBrains Mono | woff2 / Google Fonts | 等宽打字字体 |
| 木纹纹理 | PNG / CSS gradient | 拼豆板外框 subtle 纹理，可先用 CSS 模拟 |
| 金属拉丝 | CSS gradient | `repeating-linear-gradient` 模拟 |
| 音效 | MP3 / OGG | 正确提示音、错误提示音、拼豆弹入音、相框组装音、画廊欢呼音 |

**木纹 CSS 备用方案（无需图片）：**
```css
.wood-grain {
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 2px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0.03) 4px
    ),
    linear-gradient(180deg, #8B5A2B, #6B4226);
}
```
