/**
 * Local filesystem storage for development.
 * Files land under .data/uploads/ (gitignored in real projects).
 */

import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { UploadInput, UploadResult } from "./index";

const ROOT = process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads");

function safeName(name?: string) {
  const base = (name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${Date.now()}_${randomBytes(4).toString("hex")}_${base}`;
}

export async function upload(input: UploadInput): Promise<UploadResult> {
  const folder = input.folder || "misc";
  const dir = path.join(ROOT, folder);
  await mkdir(dir, { recursive: true });

  const filename = safeName(input.filename);
  const key = `${folder}/${filename}`;
  const full = path.join(ROOT, key);

  const buf = Buffer.isBuffer(input.buffer) ? input.buffer : Buffer.from(input.buffer);
  await writeFile(full, buf);

  const baseUrl = process.env.AUTH_URL || "http://localhost:8080";
  return {
    key,
    url: `${baseUrl}/api/storage/${key}`,
    provider: "local",
    contentType: input.contentType,
    size: buf.length,
  };
}

export async function remove(key: string): Promise<void> {
  const full = path.join(ROOT, key);
  await unlink(full).catch(() => {});
}

export function publicUrl(key: string): string {
  const baseUrl = process.env.AUTH_URL || "http://localhost:8080";
  return `${baseUrl}/api/storage/${key}`;
}

export function absolutePath(key: string): string {
  return path.join(ROOT, key);
}
