import type { UserProgress } from "@pixelwords/shared-types";

export interface UserModel {
  findById(id: string): Promise<any | null>;
  getProgress(userId: string, wordId: string): Promise<UserProgress | null>;
  updateProgress(userId: string, progress: UserProgress): Promise<UserProgress>;
}

export const userModel: UserModel = {
  async findById() {
    throw new Error("Not implemented: use in-memory store or add auth for MVP");
  },
  async getProgress() {
    throw new Error("Not implemented");
  },
  async updateProgress() {
    throw new Error("Not implemented");
  },
};
