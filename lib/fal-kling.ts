import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { compileAssetBoundPrompt } from "./asset-bindings";
import { optionalEnv, requireEnv } from "./env";
import { hasR2Config, publicObjectKey, uploadPublicObject } from "./r2";

type FalQueueSubmitResponse = {
  request_id?: string;
  status_url?: string;
  response_url?: string;
  cancel_url?: string;
  error?: unknown;
};

type FalQueueStatusResponse = {
  status?: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
  error?: unknown;
  logs?: unknown[];
};

type FalKlingResponse = {
  video?: {
    url?: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  };
  error?: unknown;
};

export type FalKlingAssetFiles = {
  productImagePath: string;
  productImageMimeType: string;
  creatorImagePath?: string;
  creatorImageMimeType?: string;
  starterImagePath?: string;
  starterImageMimeType?: string;
};

export type FalKlingGenerateOptions = {
  generateAudio?: boolean;
  warnings?: string[];
  debug?: {
    jobId: string;
    index: number;
  };
};

const falKlingModel = "fal-ai/kling-video/v3/pro/image-to-video";
const falPromptMaxChars = 2400;

export async function generateFalKlingVideo(
  prompt: string,
  duration: number,
  assets: FalKlingAssetFiles,
  options: FalKlingGenerateOptions = {}
): Promise<string> {
  const imageRefs = await buildFalImageReferences(assets, options);
  const promptBody = buildFalKlingPrompt(prompt, Boolean(imageRefs.creatorImageUrl), options);
  const body = {
    start_image_url: imageRefs.startImageUrl,
    prompt: promptBody,
    duration: String(duration),
    generate_audio: options.generateAudio ?? true,
    negative_prompt: "blur, distort, low quality, warped face, wrong product, wrong logo, unreadable text, extra fingers",
    cfg_scale: Number(optionalEnv("FAL_KLING_CFG_SCALE", "0.5")),
    shot_type: "customize",
    elements: imageRefs.elements
  };

  options.warnings?.push(`Fal Kling model: ${falKlingModel}.`);
  options.warnings?.push("Fal Kling mode: reference video is not sent; Gemini analysis is compiled into the prompt.");
  options.warnings?.push("Fal Kling native audio: generate_audio=true.");

  await writeFalDebugPayload(body, options.debug);

  const responseUrl = await submitFalQueue(body);
  const result = await pollFalQueue(responseUrl.statusUrl, responseUrl.responseUrl);

  if (!result.video?.url) {
    throw new Error(`Fal Kling completed without video URL: ${JSON.stringify(result)}`);
  }

  return result.video.url;
}

async function buildFalImageReferences(
  assets: FalKlingAssetFiles,
  options: FalKlingGenerateOptions
): Promise<{
  startImageUrl: string;
  creatorImageUrl?: string;
  productImageUrl: string;
  elements: Array<{
    frontal_image_url: string;
    reference_image_urls?: string[];
  }>;
}> {
  const [productImageUrl, creatorImageUrl, starterImageUrl] = await Promise.all([
    fileToPublicMediaUrl(
      assets.productImagePath,
      assets.productImageMimeType,
      options.debug?.jobId,
      "fal-product"
    ),
    assets.creatorImagePath
      ? fileToPublicMediaUrl(
          assets.creatorImagePath,
          assets.creatorImageMimeType || "image/png",
          options.debug?.jobId,
          "fal-creator"
        )
      : Promise.resolve(undefined),
    assets.starterImagePath
      ? fileToPublicMediaUrl(
          assets.starterImagePath,
          assets.starterImageMimeType || "image/jpeg",
          options.debug?.jobId,
          "fal-starter"
        )
      : Promise.resolve(undefined)
  ]);

  const elements = creatorImageUrl
    ? [
        { frontal_image_url: creatorImageUrl, reference_image_urls: [creatorImageUrl] },
        { frontal_image_url: productImageUrl, reference_image_urls: [productImageUrl] }
      ]
    : [
        { frontal_image_url: productImageUrl, reference_image_urls: [productImageUrl] }
      ];

  return {
    startImageUrl: starterImageUrl ?? creatorImageUrl ?? productImageUrl,
    creatorImageUrl,
    productImageUrl,
    elements
  };
}

async function fileToPublicMediaUrl(
  filePath: string,
  mimeType: string,
  jobId = "fal",
  label: string
): Promise<string> {
  const bytes = await readFile(filePath);
  const extension = extensionFromMimeType(mimeType);

  if (hasR2Config()) {
    return uploadPublicObject(
      publicObjectKey(jobId, `${label}${extension}`),
      bytes,
      mimeType
    );
  }

  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

function buildFalKlingPrompt(
  prompt: string,
  hasCreator: boolean,
  options: FalKlingGenerateOptions
): string {
  const compiled = compileAssetBoundPrompt(prompt, {
    productTag: hasCreator ? "@Element2" : "@Element1",
    creatorTag: hasCreator ? "@Element1" : undefined
  });
  options.warnings?.push(...compiled.warnings.map((warning) => `Fal asset compiler: ${warning}`));
  const sanitizedPrompt = stripUnsupportedFalReferences(compiled.prompt, hasCreator);

  if (hasCreator) {
    return fitFalPrompt(
      [
        "Use the uploaded creator element only for face identity when the creator appears.",
        "Do not copy the creator element's photo background, pose, outfit, or static composition.",
        "Use the uploaded product element as the exact product.",
        "Scene background, wardrobe, framing, and action follow the prompt/reference analysis.",
        "Generate native synced UGC voice when speaking."
      ].join(" "),
      sanitizedPrompt,
      options
    );
  }

  return fitFalPrompt(
    [
      "BINDING: @Element1 exact product.",
      "Preserve @Element1 silhouette, color, material, text, logo, details.",
      "Generate native synced UGC voice if the scene includes speech."
    ].join(" "),
    sanitizedPrompt,
    options
  );
}

function fitFalPrompt(
  prefix: string,
  prompt: string,
  options: FalKlingGenerateOptions
): string {
  const normalizedPrompt = normalizeFalPrompt(prompt);
  const fullPrompt = `${prefix} ${normalizedPrompt}`.trim();

  if (fullPrompt.length <= falPromptMaxChars) {
    return fullPrompt;
  }

  const budget = Math.max(800, falPromptMaxChars - prefix.length - 1);
  const compactPrompt = compactFalPrompt(normalizedPrompt, budget);
  const finalPrompt = `${prefix} ${compactPrompt}`.trim().slice(0, falPromptMaxChars);

  options.warnings?.push(
    `Fal prompt compiler: prompt trimmed from ${fullPrompt.length} to ${finalPrompt.length} characters for fal's 2500-character limit.`
  );

  return finalPrompt;
}

function normalizeFalPrompt(prompt: string): string {
  return prompt
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compactFalPrompt(prompt: string, budget: number): string {
  const singleLine = prompt
    .replace(/\n\s*-\s*/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (singleLine.length <= budget) {
    return singleLine;
  }

  const assetLock = section(singleLine, "Asset Lock:", ["Wardrobe and Hair:", "Background:", "Motion Shot Plan:", "Native Voice:"]);
  const wardrobe = section(singleLine, "Wardrobe and Hair:", ["Background:", "Motion Shot Plan:", "Native Voice:"]);
  const background = section(singleLine, "Background:", ["Motion Shot Plan:", "Native Voice:"]);
  const motion = section(singleLine, "Motion Shot Plan:", ["Native Voice:"]);
  const voice = section(singleLine, "Native Voice:", []);

  if (!assetLock && !wardrobe && !background && !motion && !voice) {
    return clipAtSentence(singleLine, budget);
  }

  const fixedParts = [
    clipSection(assetLock, 420),
    clipSection(wardrobe, 260),
    clipSection(background, 220),
    clipSection(voice, 330)
  ].filter(Boolean);
  const fixed = fixedParts.join(" ");
  const motionBudget = Math.max(300, budget - fixed.length - 1);
  const compact = [
    fixedParts[0],
    fixedParts[1],
    fixedParts[2],
    clipSection(motion || singleLine, motionBudget),
    fixedParts[3]
  ].filter(Boolean).join(" ");

  return clipAtSentence(compact, budget);
}

function section(text: string, startHeader: string, nextHeaders: string[]): string {
  const startIndex = text.indexOf(startHeader);
  if (startIndex < 0) return "";

  const afterStart = startIndex + startHeader.length;
  const nextIndex = nextHeaders
    .map((header) => text.indexOf(header, afterStart))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  return text.slice(startIndex, nextIndex ?? text.length).trim();
}

function clipSection(value: string, maxChars: number): string {
  if (!value) return "";
  return clipAtSentence(value, maxChars);
}

function clipAtSentence(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;

  const clipped = value.slice(0, maxChars).trim();
  const lastSentence = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf(";"),
    clipped.lastIndexOf(":")
  );

  if (lastSentence > maxChars * 0.55) {
    return clipped.slice(0, lastSentence + 1).trim();
  }

  return clipped.replace(/\s+\S*$/, "").trim();
}

function stripUnsupportedFalReferences(prompt: string, hasCreator: boolean): string {
  return prompt
    .replace(/@video:[A-Za-z0-9_-]+/gi, "the reference analysis")
    .replace(/@Video\d+/g, "the reference analysis")
    .replace(/@avatar:[A-Za-z0-9_-]+/g, hasCreator ? "@Element1" : "the creator")
    .replace(/@product:[A-Za-z0-9_-]+/g, hasCreator ? "@Element2" : "@Element1")
    .replace(/@Image1/g, hasCreator ? "@Element1" : "@Element1")
    .replace(/@Image2/g, hasCreator ? "@Element2" : "@Element1");
}

async function submitFalQueue(body: unknown): Promise<{ statusUrl: string; responseUrl: string }> {
  const response = await fetch(`https://queue.fal.run/${falKlingModel}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${falApiKey()}`
    },
    body: JSON.stringify(body)
  });
  const json = (await response.json()) as FalQueueSubmitResponse;

  if (!response.ok) {
    throw new Error(`Fal Kling submit failed: ${JSON.stringify(json)}`);
  }

  if (!json.status_url || !json.response_url) {
    throw new Error(`Fal Kling did not return queue URLs: ${JSON.stringify(json)}`);
  }

  return {
    statusUrl: json.status_url,
    responseUrl: json.response_url
  };
}

async function pollFalQueue(statusUrl: string, responseUrl: string): Promise<FalKlingResponse> {
  const startedAt = Date.now();
  const timeoutMs = 10 * 60 * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    await sleep(3000);

    const response = await fetch(statusUrl, {
      headers: {
        Authorization: `Key ${falApiKey()}`
      }
    });
    const status = (await response.json()) as FalQueueStatusResponse;

    if (!response.ok) {
      throw new Error(`Fal Kling status failed: ${JSON.stringify(status)}`);
    }

    if (status.status === "COMPLETED") {
      const resultResponse = await fetch(responseUrl, {
        headers: {
          Authorization: `Key ${falApiKey()}`
        }
      });
      const result = (await resultResponse.json()) as FalKlingResponse;

      if (!resultResponse.ok) {
        throw new Error(`Fal Kling result failed: ${JSON.stringify(result)}`);
      }

      return result;
    }
  }

  throw new Error("Fal Kling generation timed out.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return ".jpg";
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("webp")) return ".webp";
  return ".png";
}

async function writeFalDebugPayload(
  body: unknown,
  debug?: FalKlingGenerateOptions["debug"]
): Promise<void> {
  if (!debug) return;

  const logsDir = path.join(process.cwd(), "logs");
  await mkdir(logsDir, { recursive: true });
  await writeFile(
    path.join(logsDir, `fal-kling-request-${debug.jobId}-${debug.index}.json`),
    JSON.stringify(body, null, 2),
    "utf8"
  );
}

function falApiKey(): string {
  return optionalEnv("FAL_KEY") || requireEnv("FAL_API_KEY");
}
