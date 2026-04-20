import type { Word } from "@pixelwords/shared-types";

// SiliconFlow qwen-image (Tongyi Wanxiang)
const apiKey = process.env.SILICONFLOW_API_KEY || process.env.OPENAI_API_KEY || "";
const apiBase = process.env.SILICONFLOW_API_BASE || process.env.OPENAI_API_BASE || "https://api.siliconflow.cn/v1";
const MODEL_NAME = process.env.SILICONFLOW_IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || "Qwen/Qwen-Image";

interface ThemeStrategy {
  type: "allusion" | "quote" | "nature";
  buildPrompt: (words: Word[]) => { prompt: string; explanation: string };
}

const ALLUSIONS: Record<string, { story: string; explanation: string }> = {
  icarus: {
    story:
      "the Greek myth of Icarus flying too close to the sun with wings of feathers and wax",
    explanation:
      "This image depicts Icarus soaring toward the sun, symbolizing ambition, freedom, and the dangers of hubris.",
  },
  pandora: {
    story:
      "the Greek myth of Pandora opening a box that released all evils into the world, leaving only hope inside",
    explanation:
      "This image depicts Pandora's box, symbolizing curiosity, consequences, and the enduring power of hope.",
  },
  sisyphus: {
    story:
      "the Greek myth of Sisyphus eternally pushing a boulder up a mountain",
    explanation:
      "This image depicts Sisyphus pushing his boulder, symbolizing perseverance, futility, and the meaning we create through struggle.",
  },
  phoenix: {
    story:
      "the mythical phoenix burning to ashes and being reborn from the flames",
    explanation:
      "This image depicts the phoenix rising from ashes, symbolizing rebirth, resilience, and transformation through adversity.",
  },
};

const QUOTES: Record<string, { text: string; author: string; explanation: string }> =
  {
    "caged-bird": {
      text: "The caged bird sings of freedom",
      author: "Maya Angelou",
      explanation:
        "This image visualizes a caged bird singing, representing hope, longing, and the indomitable spirit of freedom.",
    },
    "road-less": {
      text: "Two roads diverged in a wood, and I took the one less traveled by",
      author: "Robert Frost",
      explanation:
        "This image depicts a fork in a forest path, symbolizing choice, individuality, and the courage to forge one's own way.",
    },
    "star-light": {
      text: "The stars are the street lights of eternity",
      author: "Anonymous",
      explanation:
        "This image shows stars illuminating a night landscape, symbolizing guidance, wonder, and the infinite nature of the cosmos.",
    },
  };

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildWordContext(words: Word[]): string {
  return words
    .map((w) => `${w.name} (meaning: ${w.trans.join(", ")})`)
    .join("; ");
}

/** Pixel-art prompt constraints for perler-bead style */
const PIXEL_ART_CONSTRAINTS =
  `Style: TRUE 8-bit pixel art, cute and simple, in the style of indie game sprites and emoji stickers. ` +
  `Use FLAT SOLID COLORS ONLY — absolutely NO gradients, NO shading, NO anti-aliasing, NO blur, NO texture, NO soft edges. ` +
  `Maximum 6 distinct colors. Large solid color blocks with CRISP HARD edges between regions. ` +
  `Every pixel must be a single solid color — no color mixing, no transparency, no feathering. ` +
  `Strong thick black silhouette / outline so the subject is immediately recognizable. ` +
  `Perler bead / fuse bead / Hama bead aesthetic. No text, no letters, no watermarks. ` +
  `The image must look like it is made of plastic fuse beads placed on a pegboard — chunky, bold, toy-like.`;

function getAllusionStrategy(): ThemeStrategy {
  return {
    type: "allusion",
    buildPrompt: (words: Word[]) => {
      const keys = Object.keys(ALLUSIONS);
      const key = pickRandom(keys);
      const allusion = ALLUSIONS[key];
      const prompt =
        `Create a pixel-art style illustration depicting ${allusion.story}. ` +
        `The scene should evoke: ${buildWordContext(words)}. ` +
        PIXEL_ART_CONSTRAINTS;
      return { prompt, explanation: allusion.explanation };
    },
  };
}

function getQuoteStrategy(): ThemeStrategy {
  return {
    type: "quote",
    buildPrompt: (words: Word[]) => {
      const keys = Object.keys(QUOTES);
      const key = pickRandom(keys);
      const quote = QUOTES[key];
      const prompt =
        `Create a pixel-art style illustration visualizing the poetic quote: "${quote.text}" by ${quote.author}. ` +
        `The mood should reflect: ${buildWordContext(words)}. ` +
        PIXEL_ART_CONSTRAINTS;
      return { prompt, explanation: quote.explanation };
    },
  };
}

function getNatureStrategy(): ThemeStrategy {
  return {
    type: "nature",
    buildPrompt: (words: Word[]) => {
      const scenes = [
        "serene forest at dawn",
        "vast ocean under a twilight sky",
        "mountain meadow in spring",
        "quiet river flowing through autumn trees",
        "starry desert night",
      ];
      const scene = pickRandom(scenes);
      const wordNames = words.map((w) => w.name).join(", ");
      const prompt =
        `Create a pixel-art style illustration of a ${scene} where ${wordNames} harmoniously coexist. ` +
        `The scene should evoke: ${buildWordContext(words)}. ` +
        PIXEL_ART_CONSTRAINTS;
      const explanation = `This image depicts a ${scene}, where the natural elements reflect the harmony of ${wordNames}.`;
      return { prompt, explanation };
    },
  };
}

export function getStrategy(
  type: "allusion" | "quote" | "nature"
): ThemeStrategy {
  switch (type) {
    case "allusion":
      return getAllusionStrategy();
    case "quote":
      return getQuoteStrategy();
    case "nature":
      return getNatureStrategy();
    default:
      return getNatureStrategy();
  }
}

export async function generateImage(
  words: Word[],
  strategyType: "allusion" | "quote" | "nature"
): Promise<{ imageBuffer: Buffer; explanation: string; mimeType: string }> {
  if (!apiKey) {
    throw new Error("API_KEY is not configured");
  }

  const strategy = getStrategy(strategyType);
  const { prompt, explanation } = strategy.buildPrompt(words);

  const response = await fetch(`${apiBase}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt,
      n: 1,
      size: "512x512",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image generation failed: ${response.status} ${text}`);
  }

  const json = await response.json();

  // Some providers return b64_json (OpenAI), others return url (SiliconFlow qwen-image)
  const b64 = json.data?.[0]?.b64_json;
  if (b64) {
    const imageBuffer = Buffer.from(b64, "base64");
    return { imageBuffer, explanation, mimeType: "image/png" };
  }

  const imageUrl = json.data?.[0]?.url ?? json.images?.[0]?.url;
  if (imageUrl) {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to download image from URL: ${imgRes.status}`);
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    return { imageBuffer: Buffer.from(arrayBuffer), explanation, mimeType: "image/png" };
  }

  throw new Error("No image data returned from API");
}
