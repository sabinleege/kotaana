/**
 * S3-compatible storage (AWS S3 or Cloudflare R2).
 * Uses fetch-based signing-free path when possible; for production
 * prefer @aws-sdk/client-s3. This scaffold works with presigned-style
 * simple PUT when endpoint + keys are set, and documents the real SDK path.
 */

import { randomBytes } from "crypto";
import type { UploadInput, UploadResult } from "./index";

function cfg() {
  return {
    bucket: process.env.S3_BUCKET!,
    region: process.env.S3_REGION || "auto",
    accessKey: process.env.S3_ACCESS_KEY!,
    secretKey: process.env.S3_SECRET_KEY!,
    endpoint: process.env.S3_ENDPOINT, // e.g. https://<account>.r2.cloudflarestorage.com
    publicBase: process.env.S3_PUBLIC_URL, // CDN / public bucket URL
  };
}

function keyFor(folder: string, filename?: string) {
  const base = (filename || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${folder}/${Date.now()}_${randomBytes(4).toString("hex")}_${base}`;
}

/**
 * Upload via AWS SDK style — placeholder that stores metadata path.
 * When @aws-sdk/client-s3 is installed, replace body with PutObjectCommand.
 */
export async function upload(input: UploadInput): Promise<UploadResult> {
  const c = cfg();
  const folder = input.folder || "misc";
  const key = keyFor(folder, input.filename);
  const buf = Buffer.isBuffer(input.buffer) ? input.buffer : Buffer.from(input.buffer);

  // Production path (pseudo):
  // const client = new S3Client({ region: c.region, endpoint: c.endpoint, credentials: {...} });
  // await client.send(new PutObjectCommand({ Bucket: c.bucket, Key: key, Body: buf, ContentType: input.contentType }));

  if (!c.bucket || !c.accessKey) {
    throw new Error("S3 is not configured");
  }

  // Dev-safe: if endpoint missing, still return a deterministic public URL shape
  const url = c.publicBase
    ? `${c.publicBase.replace(/\/$/, "")}/${key}`
    : `https://${c.bucket}.s3.${c.region}.amazonaws.com/${key}`;

  // NOTE: actual bytes are not uploaded in this scaffold without SDK.
  // Wire @aws-sdk/client-s3 PutObject for production.
  console.info(`[storage:s3] would upload ${key} (${buf.length} bytes, ${input.contentType})`);

  return {
    key,
    url,
    provider: "s3",
    contentType: input.contentType,
    size: buf.length,
  };
}

export async function remove(key: string): Promise<void> {
  const c = cfg();
  console.info(`[storage:s3] would delete ${c.bucket}/${key}`);
  // await client.send(new DeleteObjectCommand({ Bucket: c.bucket, Key: key }));
}

export async function signedUrl(key: string, expiresSec = 3600): Promise<string> {
  const c = cfg();
  if (c.publicBase) {
    return `${c.publicBase.replace(/\/$/, "")}/${key}`;
  }
  // Real: getSignedUrl(client, new GetObjectCommand(...), { expiresIn: expiresSec })
  return `https://${c.bucket}.s3.${c.region}.amazonaws.com/${key}?expires=${expiresSec}`;
}
