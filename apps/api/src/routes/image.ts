import { Router } from "express";
import { createHash } from "crypto";
import { generateImage } from "../services/aiImage";
import { processImage } from "../services/imagePipeline";
import { segmentBlocks } from "../services/blockSegmenter";
import { generateMockImage } from "../services/mockImage";
import type { GenerateImageRequest, GenerateImageResponse } from "@pixelwords/shared-types";

const router = Router();

// In-memory cache for MVP (replace with Redis in production)
const cache = new Map<string, GenerateImageResponse>();

function getCacheKey(words: { name: string }[], strategy: string, gridSize: number): string {
  const data = words.map((w) => w.name).join(",") + "|" + strategy + "|" + gridSize;
  return createHash("sha256").update(data).digest("hex");
}

function getMockExplanation(words: { name: string }[]): string {
  const names = words.map((w) => w.name).join(", ");
  return `This pixel-art illustration depicts a heart glowing with warmth, symbolizing the love and passion behind ${names}. (Mock data — set GEMINI_API_KEY for real AI generation.)`;
}

router.post("/generate", async (req, res) => {
  try {
    const { words, gridSize = 20, strategy = "nature" } = req.body as GenerateImageRequest;

    if (!words || words.length === 0) {
      res.status(400).json({ error: "words array is required" });
      return;
    }

    const cacheKey = getCacheKey(words, strategy, gridSize);
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // 1. Generate AI image (or mock if no API key)
    let imageBuffer: Buffer;
    let explanation: string;
    let mimeType = "image/png";

    const hasApiKey = !!process.env.OPENAI_API_KEY;
    if (hasApiKey) {
      const result = await generateImage(words, strategy);
      imageBuffer = result.imageBuffer;
      explanation = result.explanation;
      mimeType = result.mimeType;
    } else {
      imageBuffer = await generateMockImage(gridSize);
      explanation = getMockExplanation(words);
    }

    // 2. Process image into bead grid (resize + quantize + bead palette)
    const { beads } = await processImage(imageBuffer, gridSize);

    // 3. Segment into word blocks (sets wordOwner on beads)
    const seed = words.map((w) => w.name).sort().join("|");
    const blocks = segmentBlocks(gridSize, beads, words, seed);

    const beadGrid = { gridSize, beads, blocks };

    // 4. Save image (MVP: data URL; production: upload to R2/S3)
    const imageUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

    const estimatedTime = words.length * 4; // rough estimate: 4s per word

    const response: GenerateImageResponse = {
      imageUrl,
      beadData: beadGrid,
      themeExplanation: explanation,
      estimatedTime,
    };

    cache.set(cacheKey, response);
    res.json(response);
  } catch (err: any) {
    console.error("Image generation failed:", err);
    res.status(500).json({ error: err.message || "Image generation failed" });
  }
});

export default router;
