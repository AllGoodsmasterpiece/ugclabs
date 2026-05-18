import { GoogleGenAI } from "@google/genai";
import { optionalEnv, requireEnv } from "./env";
import { extractJsonObject } from "./json";
import type { ProductFocusInput, ReferenceAnalysis } from "./types";
import { getVideoFormat } from "./video-formats";

export async function analyzeReferenceVideo(
  filePath: string,
  mimeType: string,
  input: ProductFocusInput
): Promise<ReferenceAnalysis> {
  const ai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  const model = optionalEnv("GEMINI_MODEL", "gemini-2.5-flash");

  const uploaded = await ai.files.upload({
    file: filePath,
    config: {
      mimeType
    }
  });

  const activeFile = await waitForActiveGeminiFile(ai, uploaded);

  if (!activeFile.uri || !activeFile.mimeType) {
    throw new Error("Gemini file upload did not return a usable file URI.");
  }

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: activeFile.uri,
              mimeType: activeFile.mimeType
            }
          },
          {
            text: buildAnalysisPrompt(input)
          }
        ]
      }
    ]
  });

  return extractJsonObject<ReferenceAnalysis>(response.text ?? "");
}

async function waitForActiveGeminiFile(
  ai: GoogleGenAI,
  uploaded: { name?: string; uri?: string; mimeType?: string; state?: string }
) {
  if (!uploaded.name) {
    return uploaded;
  }

  const timeoutMs = 90_000;
  const startedAt = Date.now();
  let file = uploaded;

  while (Date.now() - startedAt < timeoutMs) {
    if (file.state === "ACTIVE" || file.state === undefined) {
      return file;
    }

    if (file.state === "FAILED") {
      throw new Error(`Gemini file processing failed for ${uploaded.name}.`);
    }

    await sleep(2000);
    file = await ai.files.get({ name: uploaded.name });
  }

  throw new Error(`Gemini file processing timed out for ${uploaded.name}.`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAnalysisPrompt(input: ProductFocusInput): string {
  const format = getVideoFormat(input.videoFormat);
  const shotCount = targetShotCount(input.duration);

  return `
You are analyzing a short-form reference video for UGCLabs.

Goal:
Create a structured analysis for a TikTok/Reels affiliate creative.

Product:
- Name: ${input.productName}
- URL: ${input.productUrl || "not provided"}
- Selected video format: ${format.name}
- Format intent: ${format.promptIntent}
- Tone: ${input.tone}
- Audio mode: fal Kling native audio
- Creator/model setting: ${input.creatorMode}
- Model reference image provided: ${input.creatorReferenceProvided ? "yes" : "no"}
- Reference product mode: ${referenceProductModeLabel(input)}
- Target duration: ${input.duration}s

Reference product handling:
${referenceProductAnalysisInstruction(input)}

Analyze with special attention to:
- the strongest product exposure moments
- the earliest timestamp where the product is clearly visible
- the best close-up moment for label, packaging, texture, interface, or use
- the exact shot order and timing, because the generated video must follow the reference structure
- product size in frame for every major shot: full-frame, large close-up, medium product-in-hand, small background prop, or not visible
- product position for every major shot: center, left, right, foreground, beside face, on table, in hand, on body, on screen, etc.
- the camera angle and movement that make the reference feel native
- visible product texture, hand motion, environment, and pacing
- what should be preserved if we create a new variant from this reference
- exact background type and visible room/location elements that should be recreated if product-appropriate
- outfit style, hair presentation, and creator body pose as scene styling references, not as target identity
- if native audio is selected, identify whether the creator appears to speak and what kind of voice should match the visible creator
- separate creator appearance from action structure: identify what should be preserved as motion/camera/product proof, not as the exact person identity
- separate source product identity from product proof structure when Reference product mode is Replace product
- extract motionChoreography as concrete, second-by-second executable direction: camera distance, hand action, face action, product visibility rule, must-keep-visible elements, and dialogue beat

Shot planner requirement:
- Build a shotPlan with ${shotCount} timed shots covering the full ${input.duration}s target output.
- Use timestamp windows like "0.0s", "1.5s", "3.0s".
- If the uploaded reference is longer than ${input.duration}s, compress the same structure into ${input.duration}s.
- If the reference is shorter, preserve its sequence and leave no dead time.
- Each shot must say what the generated video should preserve structurally, without treating source creator identity as the target avatar.
- For Replace product mode, shotPlan must describe transferable choreography, framing, camera behavior, and proof moments, not source product appearance.
- For Same product mode, shotPlan may preserve matching product handling and product-use sequence, but uploaded product image still wins visually.
- Also build motionChoreography with ${shotCount} timed beats. It must be more operational than shotPlan, suitable for direct video generation choreography.
- Each motion beat must say exactly what stays visible and what the hands/face/camera do during that time window.
- The productVisibilityRule must prevent product drift, hidden products, off-frame products, and generic face-only moments.

Return strict JSON only. No markdown.

Schema:
{
  "format": "${format.id}",
  "productCategory": "short category",
  "visualStyle": "lighting, camera, background, composition",
  "sceneSummary": ["3-6 short scene observations"],
  "structureSummary": "one sentence summary of the reference video's shot structure",
  "shotPlan": [
    {
      "start": "0.0s",
      "end": "1.0s",
      "cameraFraming": "vertical selfie close-up / overhead table macro / back-camera product close-up / screen capture style",
      "productPosition": "where product is in frame",
      "productScale": "how large product appears in frame",
      "handOrCreatorAction": "specific hand, creator, body, or screen action",
      "cameraMotion": "static, handheld push-in, tilt, pan, turn, follow, cut, etc.",
      "dialogueOrExpression": "spoken beat, reaction, expression, or silent detail",
      "preserveForGeneration": "background, wardrobe style, pose/action, framing, timing, and product proof behavior to preserve when generating the new video"
    }
  ],
  "motionChoreography": [
    {
      "start": "0.0s",
      "end": "1.0s",
      "cameraDistance": "selfie close-up / medium shot / macro close-up / overhead / screen distance",
      "handAction": "concrete physical or screen action during this beat",
      "faceAction": "creator expression, mouth movement, gaze, or no face",
      "productVisibilityRule": "exact rule for keeping product visible, e.g. product fills 30% of frame and front design faces camera",
      "mustKeepVisible": ["uploaded product", "logo/text", "creator face", "screen result"],
      "dialogueBeat": "what the creator should say or imply during this beat"
    }
  ],
  "earliestClearProductMoment": "timestamp and description",
  "bestProductProofShot": "timestamp and description",
  "productExposureMoments": ["when and how product appears"],
  "hookPatterns": ["short hook structures that match this reference"],
  "pacingNotes": "timing and rhythm notes",
  "avoid": ["things to avoid so output does not look broken or off-brand"]
}
`;
}

function targetShotCount(duration: ProductFocusInput["duration"]): string {
  if (duration === 5) return "4-5";
  if (duration === 10) return "5-7";
  return "6-9";
}

function referenceProductModeLabel(input: ProductFocusInput): string {
  return input.referenceProductMode === "same_product"
    ? "Same product as reference video"
    : "Replace reference product with uploaded product";
}

function referenceProductAnalysisInstruction(input: ProductFocusInput): string {
  if (input.referenceProductMode === "same_product") {
    return [
      "- The reference prompt/video is intended to show the same product as the uploaded product image.",
      "- Preserve reference product handling, use order, proof moments, and visible product detail emphasis when they match the uploaded product image.",
      "- The uploaded product image remains the target product source of truth if there is any conflict."
    ].join("\n");
  }

  return [
    "- The reference prompt/video may show a different source product.",
    "- Do not treat source-product decorations, colors, stickers, charms, labels, logos, packaging, material, or shape as the target product.",
    "- The uploaded product image is the target product source of truth.",
    "- Preserve only how the product is demonstrated, framed, moved, or proved."
  ].join("\n");
}
