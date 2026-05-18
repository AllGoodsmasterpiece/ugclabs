import { readFile, writeFile } from "node:fs/promises";
import { optionalEnv, requireEnv } from "./env";
import { runtimeOutputPath, runtimeOutputUrl } from "./runtime-storage";
import type { AssetProfile } from "./types";

type QualityStarterOptions = {
  jobId: string;
  referenceFramePath?: string;
  productImagePath: string;
  productImageMimeType: string;
  creatorImagePath: string;
  creatorImageMimeType: string;
  productName: string;
  productAssetProfile?: AssetProfile;
  generationMode: string;
  videoFormatName?: string;
};

type OpenAIImageEditResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
};

export async function createQualityStarterImage(
  options: QualityStarterOptions
): Promise<{ localPath: string; localUrl: string }> {
  const model = optionalEnv("OPENAI_STARTER_IMAGE_MODEL", "gpt-image-2");
  const quality = optionalEnv("OPENAI_STARTER_IMAGE_QUALITY", "medium");
  const filename = `${options.jobId}-quality-starter.png`;
  const target = await runtimeOutputPath(filename);
  const prompt = buildQualityStarterPrompt(options.productName, options);
  const form = new FormData();

  form.set("model", model);
  form.set("prompt", prompt);
  form.set("size", "1024x1536");
  form.set("quality", quality);
  form.append(
    "image[]",
    await fileBlob(options.creatorImagePath, options.creatorImageMimeType),
    "creator-reference.jpg"
  );
  form.append(
    "image[]",
    await fileBlob(options.productImagePath, options.productImageMimeType),
    "product-reference.png"
  );
  if (options.referenceFramePath) {
    form.append(
      "image[]",
      await fileBlob(options.referenceFramePath, "image/jpeg"),
      "scene-reference.jpg"
    );
  }

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`
    },
    body: form
  });
  const json = (await response.json()) as OpenAIImageEditResponse;

  if (!response.ok) {
    throw new Error(`Starter image generation failed: ${json.error?.message ?? JSON.stringify(json)}`);
  }

  const b64 = json.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error(`Starter image generation returned no image data: ${JSON.stringify(json)}`);
  }

  await writeFile(target, Buffer.from(b64, "base64"));

  return {
    localPath: target,
    localUrl: runtimeOutputUrl(filename)
  };
}

async function fileBlob(filePath: string, mimeType: string): Promise<Blob> {
  const bytes = await readFile(filePath);
  return new Blob([bytes], { type: mimeType });
}

function buildQualityStarterPrompt(productName: string, options: QualityStarterOptions): string {
  const hasSceneReference = Boolean(options.referenceFramePath);
  const placement = productUseDirectorBrief(options.productAssetProfile, productName);

  return [
    "Create one vertical 9:16 photorealistic UGC video starting frame.",
    "Use image 1 only for the target creator's face identity, hair color, age range, and overall facial appearance.",
    "Use image 2 as the exact product reference; preserve its silhouette, color, material, text, logo placement, and visible design details.",
    hasSceneReference
      ? "Use image 3 only as the scene composition reference: camera distance, background type, lighting mood, framing, and product/hand placement."
      : `Create a natural ${options.videoFormatName || "UGC"} scene in a realistic everyday environment that fits the product.`,
    hasSceneReference
      ? "Do not copy the person from image 3. Remove the original reference-video person completely."
      : "Do not invent a second person or use a generic stock-photo pose.",
    "Do not copy the creator reference photo's original background, outfit, pose, or static studio composition.",
    "Do not default to a straight-on passport pose with the product held at chest height unless the Product Use Director says that pose is natural.",
    placement,
    `Show the creator naturally using, presenting, or interacting with the ${productName || "uploaded product"} in the first frame.`,
    "The frame must already look like the opening frame of a native TikTok/Reels UGC ad, not a product mockup, not a collage, not a side-by-side comparison.",
    "No captions, no UI overlays, no watermarks, no extra products, no extra logos."
  ].join(" ");
}

function productUseDirectorBrief(profile: AssetProfile | undefined, productName: string): string {
  const composition = profile?.productUnderstanding?.starterComposition;
  const understanding = profile?.productUnderstanding;
  const physicalUseModel = understanding?.physicalUseModel;

  if (!composition && !physicalUseModel) {
    return fallbackProductPlacementGuidance(productName);
  }

  return [
    "Product Use Director:",
    `Product type: ${understanding?.productType || productName || "uploaded product"}.`,
    composition ? `Product scale: ${composition.productScale}.` : "",
    composition ? `Natural placement: ${composition.naturalPlacement}.` : "",
    composition ? `Creator position: ${composition.creatorPosition}.` : "",
    composition ? `Primary interaction: ${composition.primaryInteraction}.` : "",
    composition ? `Camera framing: ${composition.cameraFraming}.` : "",
    composition?.badPoses.length ? `Bad poses to avoid: ${composition.badPoses.join("; ")}.` : "",
    composition ? `Starter frame brief: ${composition.starterFrameBrief}.` : "",
    physicalUseModel ? `Physical use model: ${physicalUseModel.plannerDirective}.` : "",
    physicalUseModel ? `Valid interaction points: ${physicalUseModel.validInteractionPoints.join("; ")}.` : "",
    physicalUseModel ? `Invalid interaction points: ${physicalUseModel.invalidInteractionPoints.join("; ")}.` : "",
    physicalUseModel ? `Required preconditions: ${physicalUseModel.requiredPreconditions.join("; ")}.` : "",
    physicalUseModel ? `Natural use sequence: ${physicalUseModel.naturalUseSequence.join("; ")}.` : "",
    physicalUseModel ? `Failure modes to avoid: ${physicalUseModel.failureModesToAvoid.join("; ")}.` : "",
    "If the reference scene conflicts with this physical product-use direction, keep the reference lighting/mood/camera feel but follow the Product Use Director for product placement and interaction."
  ].filter(Boolean).join(" ");
}

function fallbackProductPlacementGuidance(productName: string): string {
  const text = productName.toLowerCase();

  if (/(toaster|oven|air fryer|blender|coffee maker|kettle|microwave|appliance)/.test(text)) {
    return [
      "For countertop appliances, place the product on a kitchen counter or table in the foreground.",
      "The creator should stand or lean beside it, with one hand on a lever, knob, handle, toast, cup, or nearby countertop.",
      "Do not make the creator hold the appliance up at chest height like a phone case or tumbler."
    ].join(" ");
  }

  if (/(phone|iphone|case|cover)/.test(text)) {
    return [
      "For phone cases, the creator may hold the phone near face level or angled toward the camera.",
      "Show the back design and camera cutout clearly, with fingers on the edges rather than covering the print."
    ].join(" ");
  }

  if (/(tumbler|cup|bottle|mug|stanley|straw|lid)/.test(text)) {
    return [
      "For drinkware, the creator may hold it naturally by the handle or body, with straw/lid visible.",
      "A sip, carry, or desk/kitchen placement pose is acceptable."
    ].join(" ");
  }

  if (/(serum|cream|skincare|beauty|lip|makeup|cleanser|lotion|sunscreen)/.test(text)) {
    return [
      "For beauty products, use a routine-style pose: product near face, hand applying, swatching, opening, or showing texture.",
      "Keep the product label visible and do not hide it behind fingers."
    ].join(" ");
  }

  if (/(app|software|dashboard|website|platform|tool|saas|screen)/.test(text)) {
    return [
      "For app or software products, show a phone or laptop screen in a natural demo pose.",
      "The creator can point at or react to the screen while the interface remains visible."
    ].join(" ");
  }

  return [
    "Choose a product-appropriate pose based on the item's size and real use.",
    "Small handheld items can be held near camera; larger items should sit on a surface with the creator interacting beside them."
  ].join(" ");
}
