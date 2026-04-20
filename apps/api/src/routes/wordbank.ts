import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import type { WordBankMeta, Word } from "@pixelwords/shared-types";

const router = Router();

interface WordBankFile {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  length: number;
  words: Array<{
    name: string;
    trans: string[];
    usphone?: string;
    ukphone?: string;
  }>;
}

function loadWordBanks(): Record<string, { meta: WordBankMeta; words: Word[] }> {
  const banksDir = join(__dirname, "../../../../packages/word-banks");
  const files = ["cet4.json", "cet6.json", "gre.json"];
  const banks: Record<string, { meta: WordBankMeta; words: Word[] }> = {};

  for (const file of files) {
    try {
      const raw = readFileSync(join(banksDir, file), "utf-8");
      const data: WordBankFile = JSON.parse(raw);
      const words: Word[] = data.words.map((w, i) => ({
        id: `${data.id}_${String(i + 1).padStart(3, "0")}`,
        name: w.name,
        trans: w.trans,
        usphone: w.usphone,
        ukphone: w.ukphone,
        category: data.name,
      }));
      banks[data.id] = {
        meta: {
          id: data.id,
          name: data.name,
          description: data.description,
          wordCount: data.length,
          category: data.category,
        },
        words,
      };
    } catch (err) {
      console.error(`Failed to load word bank ${file}:`, err);
    }
  }

  return banks;
}

const wordBanks = loadWordBanks();

router.get("/", (_req, res) => {
  const metas = Object.values(wordBanks).map((wb) => wb.meta);
  res.json(metas);
});

router.get("/:id", (req, res) => {
  const bank = wordBanks[req.params.id];
  if (!bank) {
    res.status(404).json({ error: "Word bank not found" });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const size = Math.min(200, Math.max(1, parseInt(req.query.size as string) || 50));
  const start = (page - 1) * size;
  const end = start + size;
  const paginated = bank.words.slice(start, end);

  res.json({
    data: paginated,
    pagination: {
      page,
      size,
      total: bank.words.length,
      totalPages: Math.ceil(bank.words.length / size),
    },
  });
});

export default router;
