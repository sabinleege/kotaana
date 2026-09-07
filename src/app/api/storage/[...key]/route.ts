/**
 * GET /api/storage/* — serve local uploads (dev)
 */

import { route, json } from "@/lib/api";
import { absolutePath } from "@/lib/storage/local";
import { readFile } from "fs/promises";
import path from "path";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ key: string[] }> }) => {
  const { key: parts } = await ctx.params;
  const key = parts.map(decodeURIComponent).join("/");

  // Prevent path traversal
  if (key.includes("..") || path.isAbsolute(key)) {
    return json({ error: "Invalid key" }, 400);
  }

  try {
    const full = absolutePath(key);
    const data = await readFile(full);
    const ext = path.extname(key).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "application/octet-stream";

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return json({ error: "Not found" }, 404);
  }
});
