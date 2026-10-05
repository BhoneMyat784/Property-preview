import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { dataDir } from "./config.js";
export interface PhotoStorage {
  write(bytes: Buffer): Promise<string>;
  remove(key: string): Promise<void>;
  path(key: string): string;
}
const root = path.join(dataDir, "uploads");
export const storage: PhotoStorage = {
  async write(bytes) {
    await fs.mkdir(root, { recursive: true });
    const key = `${crypto.randomUUID()}.webp`;
    const image = sharp(bytes, { limitInputPixels: 25000000 });
    const info = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(info.format || ""))
      throw new Error("Only JPEG, PNG and WebP photos are supported");
    await image
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(path.join(root, key));
    return key;
  },
  async remove(key) {
    await fs.unlink(this.path(key)).catch(() => {});
  },
  path(key) {
    if (!/^[a-f0-9-]+\.webp$/.test(key)) throw new Error("Invalid photo key");
    return path.join(root, key);
  },
};
