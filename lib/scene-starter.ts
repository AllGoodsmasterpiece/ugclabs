import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outputDir = path.join(process.cwd(), "public", "outputs");

export async function createReferenceStarterFrame(
  referenceVideoPath: string,
  jobId: string,
  warnings: string[]
): Promise<string | undefined> {
  const target = path.join(outputDir, `${jobId}-reference-starter.jpg`);
  await mkdir(outputDir, { recursive: true });

  try {
    await runFfmpeg([
      "-y",
      "-ss",
      "0.2",
      "-i",
      referenceVideoPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2",
      "-q:v",
      "2",
      "-update",
      "1",
      target
    ]);
    warnings.push("Scene starter: extracted first reference-video frame for fal start_image_url.");
    return target;
  } catch (error) {
    warnings.push(
      `Scene starter warning: could not extract reference frame (${error instanceof Error ? error.message : "unknown error"}). Falling back to product image start frame.`
    );
    return undefined;
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"]
    });
    const stderr: Buffer[] = [];

    child.stderr.on("data", (chunk: Buffer) => {
      stderr.push(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const message = Buffer.concat(stderr).toString("utf8").split("\n").slice(-4).join(" ").trim();
      reject(new Error(message || `ffmpeg exited with code ${code}`));
    });
  });
}
