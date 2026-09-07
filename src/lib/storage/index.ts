/**
 * Storage facade — local disk in dev, S3/R2 when configured.
 */

import * as local from "./local";
import * as s3 from "./s3";

export type UploadInput = {
  buffer: Buffer | Uint8Array;
  contentType: string;
  filename?: string;
  folder?: string; // e.g. "progress-photos", "meals", "avatars"
};

export type UploadResult = {
  key: string;
  url: string;
  provider: "local" | "s3";
  contentType: string;
  size: number;
};

function useS3(): boolean {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
  );
}

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  if (useS3()) return s3.upload(input);
  return local.upload(input);
}

export async function deleteFile(key: string): Promise<void> {
  if (useS3()) return s3.remove(key);
  return local.remove(key);
}

export async function getSignedUrl(key: string, expiresSec = 3600): Promise<string> {
  if (useS3()) return s3.signedUrl(key, expiresSec);
  return local.publicUrl(key);
}

export function isRemoteStorage(): boolean {
  return useS3();
}
