import { writeFile } from "node:fs/promises";
import path from "node:path";
import { hasR2Config, publicObjectKey, uploadPublicObject } from "./r2";
import { contentTypeFromFilename, runtimeOutputPath, runtimeOutputUrl, runtimeUploadPath } from "./runtime-storage";

export async function saveUpload(file: File, jobId: string): Promise<string> {
  return saveNamedUpload(file, jobId, "reference");
}

export async function saveProductImage(file: File, jobId: string): Promise<string> {
  return saveNamedUpload(file, jobId, "product");
}

export async function saveCreatorImage(file: File, jobId: string, label = "creator"): Promise<string> {
  return saveNamedUpload(file, jobId, label);
}

async function saveNamedUpload(file: File, jobId: string, label: string): Promise<string> {
  const extension = extensionFromFile(file.name, file.type);
  const safeName = `${jobId}-${label}${extension}`;
  const target = await runtimeUploadPath(safeName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(target, bytes);
  return target;
}

export async function saveOutputBuffer(
  bytes: Buffer,
  jobId: string,
  filename: string
): Promise<{ localPath: string; localUrl: string }> {
  const safeName = `${jobId}-${filename}`;
  const target = await runtimeOutputPath(safeName);
  await writeFile(target, bytes);

  if (hasR2Config()) {
    const publicUrl = await uploadPublicObject(
      publicObjectKey(jobId, safeName),
      bytes,
      contentTypeFromFilename(safeName)
    );

    return {
      localPath: target,
      localUrl: publicUrl
    };
  }

  return {
    localPath: target,
    localUrl: runtimeOutputUrl(safeName)
  };
}

function extensionFromFile(name: string, mimeType: string): string {
  const fromName = path.extname(name);
  if (fromName) return fromName.toLowerCase();
  if (mimeType.includes("jpeg")) return ".jpg";
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("webp")) return ".webp";
  if (mimeType.includes("quicktime")) return ".mov";
  if (mimeType.includes("webm")) return ".webm";
  return ".mp4";
}
