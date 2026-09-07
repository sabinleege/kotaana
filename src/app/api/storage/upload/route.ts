/**
 * POST /api/storage/upload
 * multipart/form-data: file, folder?
 * or JSON: { dataUrl, filename?, folder?, contentType? }
 */

import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { uploadFile } from "@/lib/storage";

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const contentType = req.headers.get("content-type") || "";

  let buffer: Buffer;
  let mime = "application/octet-stream";
  let filename = "upload.bin";
  let folder = "misc";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return json({ error: "file required" }, 400);
    }
    const f = file as File;
    const ab = await f.arrayBuffer();
    buffer = Buffer.from(ab);
    mime = f.type || mime;
    filename = f.name || filename;
    folder = String(form.get("folder") || "misc");
  } else {
    const body = await req.json();
    const dataUrl = String(body.dataUrl || "");
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return json({ error: "dataUrl (base64) required" }, 400);
    mime = body.contentType || match[1];
    buffer = Buffer.from(match[2], "base64");
    filename = body.filename || filename;
    folder = body.folder || "misc";
  }

  // Soft size guard (8MB)
  if (buffer.length > 8 * 1024 * 1024) {
    return json({ error: "File too large (max 8MB)" }, 413);
  }

  const allowedFolders = ["progress-photos", "meals", "avatars", "injuries", "misc"];
  if (!allowedFolders.includes(folder)) folder = "misc";

  const result = await uploadFile({
    buffer,
    contentType: mime,
    filename,
    folder,
  });

  return json({
    ...result,
    uploadedBy: me.id,
  }, 201);
});
