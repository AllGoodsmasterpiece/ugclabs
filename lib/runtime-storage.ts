import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const storageRoot = process.env.UGCLABS_STORAGE_DIR
  ? path.resolve(process.env.UGCLABS_STORAGE_DIR)
  : path.join(process.cwd(), ".storage");

const outputDir = path.join(storageRoot, "outputs");
const legacyPublicOutputDir = path.join(process.cwd(), "public", "outputs");

export async function runtimeOutputPath(filename: string): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  return path.join(outputDir, sanitizeAssetFilename(filename));
}

export function runtimeOutputUrl(filename: string): string {
  return `/api/assets/${encodeURIComponent(sanitizeAssetFilename(filename))}`;
}

export function runtimeOutputCandidatePath(filename: string): string {
  return path.join(outputDir, sanitizeAssetFilename(filename));
}

export function legacyPublicOutputCandidatePath(filename: string): string {
  return path.join(legacyPublicOutputDir, sanitizeAssetFilename(filename));
}

export async function readRuntimeOutput(filename: string): Promise<Buffer> {
  const safeName = sanitizeAssetFilename(filename);
  const runtimePath = path.join(outputDir, safeName);

  try {
    return await readFile(runtimePath);
  } catch {
    return readFile(path.join(legacyPublicOutputDir, safeName));
  }
}

export function sanitizeAssetFilename(filename: string): string {
  const base = path.basename(filename);

  if (!/^[a-z0-9_-]+\.(png|jpe?g|webp|mp4|mov|webm)$/i.test(base)) {
    throw new Error("Invalid asset filename.");
  }

  return base;
}

export function contentTypeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".webm")) return "video/webm";
  return "video/mp4";
}
