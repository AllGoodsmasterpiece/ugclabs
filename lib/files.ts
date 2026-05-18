import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const outputDir = path.join(process.cwd(), "public", "outputs");

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
  await mkdir(uploadDir, { recursive: true });
  const extension = extensionFromFile(file.name, file.type);
  const safeName = `${jobId}-${label}${extension}`;
  const target = path.join(uploadDir, safeName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(target, bytes);
  return target;
}

export async function saveOutputBuffer(
  bytes: Buffer,
  jobId: string,
  filename: string
): Promise<{ localPath: string; localUrl: string }> {
  await mkdir(outputDir, { recursive: true });
  const safeName = `${jobId}-${filename}`;
  const target = path.join(outputDir, safeName);
  await writeFile(target, bytes);
  return {
    localPath: target,
    localUrl: `/outputs/${safeName}`
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
