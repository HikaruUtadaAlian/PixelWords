import type { GalleryItem } from "@pixelwords/shared-types";

// Placeholder: replace with actual PostgreSQL/ORM model in production
export interface GalleryModel {
  create(item: Omit<GalleryItem, "id">): Promise<GalleryItem>;
  findAll(userId?: string): Promise<GalleryItem[]>;
  findById(id: string): Promise<GalleryItem | null>;
  delete(id: string): Promise<boolean>;
}

export const galleryModel: GalleryModel = {
  async create(item) {
    throw new Error("Not implemented: use in-memory store in routes for MVP");
  },
  async findAll() {
    throw new Error("Not implemented: use in-memory store in routes for MVP");
  },
  async findById() {
    throw new Error("Not implemented: use in-memory store in routes for MVP");
  },
  async delete() {
    throw new Error("Not implemented: use in-memory store in routes for MVP");
  },
};
