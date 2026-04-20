import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import type { GalleryItem } from "@pixelwords/shared-types";

const router = Router();

// In-memory store for MVP
const galleryStore = new Map<string, GalleryItem>();

router.get("/", (_req, res) => {
  const items = Array.from(galleryStore.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  res.json(items);
});

router.post("/", (req, res) => {
  try {
    const item: GalleryItem = {
      id: uuidv4(),
      ...req.body,
      completedAt: new Date(req.body.completedAt || Date.now()),
    };
    galleryStore.set(item.id, item);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id", (req, res) => {
  const item = galleryStore.get(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Gallery item not found" });
    return;
  }
  res.json(item);
});

router.delete("/:id", (req, res) => {
  const deleted = galleryStore.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Gallery item not found" });
    return;
  }
  res.status(204).send();
});

export default router;
