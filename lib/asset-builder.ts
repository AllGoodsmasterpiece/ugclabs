import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CREATOR_ASSET_TOKEN, PRODUCT_ASSET_TOKEN, REFERENCE_VIDEO_ASSET_TOKEN } from "./asset-bindings";
import { optionalEnv, requireEnv } from "./env";
import { extractJsonObject } from "./json";
import type {
  AssetKind,
  AssetProfile,
  ProductPhysicalUseModel,
  ProductUnderstanding,
  ProductVisualLock,
  StarterComposition
} from "./types";

type BuildImageAssetProfileOptions = {
  kind: Extract<AssetKind, "product" | "avatar">;
  filePath: string;
  mimeType: string;
  label: string;
};

type BuildReferenceVideoAssetProfileOptions = {
  filePath: string;
  mimeType: string;
  label: string;
};

type OpenAIAssetResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

type AssetAnalysisResponse = {
  promptNounPhrase?: string;
  description?: string;
  keyDetails?: string[];
  visibleText?: string[];
  colors?: string[];
  qualityWarnings?: string[];
  productUnderstanding?: Partial<ProductUnderstanding>;
  productVisualLock?: Partial<ProductVisualLock>;
};

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"]);

export async function buildImageAssetProfile(
  options: BuildImageAssetProfileOptions
): Promise<AssetProfile> {
  const bytes = await readFile(options.filePath);
  const dimensions = sniffImageDimensions(bytes, options.mimeType);
  const qualityWarnings = imageQualityWarnings(bytes, options.mimeType, dimensions);
  const token = options.kind === "product" ? PRODUCT_ASSET_TOKEN : CREATOR_ASSET_TOKEN;
  const fallback = fallbackImageProfile(options.kind, options.label, dimensions, qualityWarnings);

  const analysis = process.env.OPENAI_API_KEY
    ? await analyzeImageWithOpenAI(options, bytes, fallback).catch(() => fallback)
    : fallback;

  return {
    id: `${options.kind}_${randomUUID()}`,
    kind: options.kind,
    token,
    label: options.label,
    promptNounPhrase: cleanSentenceFragment(analysis.promptNounPhrase ?? fallback.promptNounPhrase ?? "the uploaded asset"),
    description: analysis.description ?? fallback.description ?? "Uploaded visual reference asset.",
    keyDetails: compactList(analysis.keyDetails ?? fallback.keyDetails),
    visibleText: compactList(analysis.visibleText),
    colors: compactList(analysis.colors),
    dimensions,
    sizeBytes: bytes.length,
    mimeType: options.mimeType,
    qualityWarnings: compactList([...qualityWarnings, ...compactList(analysis.qualityWarnings)]),
    analysisProvider: analysis === fallback ? "fallback" : "openai",
    productUnderstanding: options.kind === "product"
      ? normalizeProductUnderstanding(analysis.productUnderstanding, fallback.productUnderstanding)
      : undefined,
    productVisualLock: options.kind === "product"
      ? normalizeProductVisualLock(analysis.productVisualLock, fallback.productVisualLock, {
          label: options.label,
          keyDetails: analysis.keyDetails ?? fallback.keyDetails,
          visibleText: analysis.visibleText ?? fallback.visibleText,
          colors: analysis.colors ?? fallback.colors
        })
      : undefined
  };
}

export async function buildReferenceVideoAssetProfile(
  options: BuildReferenceVideoAssetProfileOptions
): Promise<AssetProfile> {
  const bytes = await readFile(options.filePath);

  return {
    id: `reference_video_${randomUUID()}`,
    kind: "reference_video",
    token: REFERENCE_VIDEO_ASSET_TOKEN,
    label: options.label,
    promptNounPhrase: "the uploaded reference video",
    description: "Overall UGC reference clip for structure, framing, pacing, gestures, product demonstration behavior, scene mood, and shot order.",
    keyDetails: [
      "Use as the overall creative reference clip.",
      "Do not treat it as the source of truth for target product appearance.",
      "Do not treat it as the source of truth for target avatar identity when an avatar image is uploaded."
    ],
    sizeBytes: bytes.length,
    mimeType: options.mimeType,
    qualityWarnings: videoQualityWarnings(bytes, options.mimeType),
    analysisProvider: "fallback"
  };
}

export async function writeAssetProfilesDebug(
  jobId: string,
  profiles: Array<AssetProfile | undefined>
): Promise<void> {
  const logsDir = path.join(process.cwd(), "logs");
  await mkdir(logsDir, { recursive: true });
  await writeFile(
    path.join(logsDir, `asset-profiles-${jobId}.json`),
    JSON.stringify(profiles.filter(Boolean), null, 2),
    "utf8"
  );
}

function fallbackImageProfile(
  kind: "product" | "avatar",
  label: string,
  dimensions: AssetProfile["dimensions"],
  qualityWarnings: string[]
): AssetAnalysisResponse {
  if (kind === "product") {
    return {
      promptNounPhrase: label ? `the exact ${label}` : "the exact uploaded product",
      description: "Target product image uploaded by the user. Preserve the visible shape, color, text, logo placement, material, and design details.",
      keyDetails: [
        "Target product appearance source of truth.",
        dimensions ? `Image dimensions: ${dimensions.width}x${dimensions.height}.` : "Image dimensions unavailable.",
        ...qualityWarnings
      ],
      productUnderstanding: {
        productType: label || "uploaded product",
        productCategory: "unknown",
        starterComposition: fallbackStarterComposition(label),
        physicalUseModel: fallbackPhysicalUseModel(label),
        primaryUseCase: "Use the product in the most natural real-world way suggested by its visible form and the user's product name.",
        naturalUseEnvironments: ["a realistic everyday setting where this product would naturally be used"],
        typicalUserActions: ["hold, handle, operate, wear, apply, open, or demonstrate the product according to its visible type"],
        functionalBenefitsToDemonstrate: ["show a clear function, result, fit, texture, handling, or convenience proof"],
        visualProofDetails: ["shape", "material", "logo or text", "color", "recognizable design details"],
        copyAngles: fallbackCopyGuardrails(label).copyAngles,
        allowedActionVerbs: fallbackCopyGuardrails(label).allowedActionVerbs,
        forbiddenActionVerbs: fallbackCopyGuardrails(label).forbiddenActionVerbs,
        proofWords: fallbackCopyGuardrails(label).proofWords,
        firstSecondVisualPriority: "Show the uploaded product clearly in the first second.",
        uncertaintyNotes: ["Fallback product understanding used because detailed image analysis was unavailable."]
      },
      productVisualLock: {
        silhouette: "Preserve the exact visible product outline and proportions from the uploaded product image.",
        cameraCutoutOrKeyShape: "Preserve any distinctive top, lens, opening, handle, control, screen, cap, or cutout shape that identifies the product.",
        textAndLogoPlacement: compactList([
          "Keep visible text and logos in the same approximate area as the uploaded product image."
        ]),
        graphicElementPlacement: compactList([
          "Keep visible graphics, prints, stickers, pattern blocks, and decorative elements in the same approximate layout."
        ]),
        colorMaterialRules: compactList([
          "Keep the uploaded product colors, finish, transparency, gloss, metal, fabric, plastic, or paper material cues."
        ]),
        frontViewReferenceQuality: dimensions
          ? `Reference image is ${dimensions.width}x${dimensions.height}; use it as the clean front-view product reference when possible.`
          : "Use the uploaded image as the clean front-view product reference when possible.",
        preservationPrompt: "Do not redesign the product. Preserve the exact uploaded product silhouette, colors, visible text/logo, printed graphics, and material finish.",
        backgroundRemovalNotes: compactList([
          "Treat the product body as the asset and ignore unrelated background pixels when composing the new scene."
        ])
      },
      qualityWarnings
    };
  }

  return {
    promptNounPhrase: "the uploaded creator model",
    description: "Target avatar/model image uploaded by the user. Preserve the visible age range, face shape, hair, styling, outfit, and overall look.",
    keyDetails: [
      "Target creator identity and styling source of truth.",
      dimensions ? `Image dimensions: ${dimensions.width}x${dimensions.height}.` : "Image dimensions unavailable.",
      ...qualityWarnings
    ],
    qualityWarnings
  };
}

async function analyzeImageWithOpenAI(
  options: BuildImageAssetProfileOptions,
  bytes: Buffer,
  fallback: AssetAnalysisResponse
): Promise<AssetAnalysisResponse> {
  const model = optionalEnv("OPENAI_ASSET_MODEL", optionalEnv("OPENAI_PLANNER_MODEL", "gpt-5.4-mini"));
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildImageAnalysisPrompt(options.kind, options.label)
            },
            {
              type: "input_image",
              image_url: `data:${options.mimeType};base64,${bytes.toString("base64")}`
            }
          ]
        }
      ]
    })
  });

  const json = (await response.json()) as OpenAIAssetResponse;

  if (!response.ok) {
    throw new Error(`OpenAI asset analysis failed: ${json.error?.message ?? JSON.stringify(json)}`);
  }

  const text =
    json.output_text ??
    json.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("\n") ??
    "";
  const parsed = extractJsonObject<AssetAnalysisResponse>(text);

  return {
    ...fallback,
    ...parsed,
    keyDetails: compactList(parsed.keyDetails ?? fallback.keyDetails),
    qualityWarnings: compactList(parsed.qualityWarnings ?? fallback.qualityWarnings),
    productVisualLock: parsed.productVisualLock ?? fallback.productVisualLock
  };
}

function buildImageAnalysisPrompt(kind: "product" | "avatar", label: string): string {
  if (kind === "product") {
    return `
Analyze this uploaded target product image for a UGC video generation asset profile.

Product label from user: ${label || "not provided"}

Return strict JSON only. Do not include markdown.

Schema:
{
  "promptNounPhrase": "short noun phrase to place immediately before @product token, e.g. clear iPhone case with black doodle print",
  "description": "one sentence visual description focused only on visible product details",
  "keyDetails": ["shape, material, logo/text, color, design details that must be preserved"],
  "visibleText": ["visible readable text or logos"],
  "colors": ["main colors"],
    "productUnderstanding": {
    "productType": "what the item is, e.g. tennis racket, wireless earbuds, tumbler, skincare serum",
    "productCategory": "broad product category",
    "starterComposition": {
      "productScale": "handheld item / tabletop object / countertop appliance / wearable item / screen-based product / large object",
      "naturalPlacement": "where the product should physically be in the opening frame, e.g. in hand near camera, on kitchen counter, worn on body, on desk, on phone screen",
      "creatorPosition": "where the creator should be relative to the product, e.g. holding it close to camera, standing beside it, leaning over a counter, wearing it, pointing at screen",
      "primaryInteraction": "the most natural first-frame interaction, e.g. grip edge, press lever, hold toast, swatch texture, tap app screen",
      "cameraFraming": "starter frame composition, e.g. selfie close-up, product foreground on counter with creator beside it, macro hand close-up, over-shoulder screen view",
      "badPoses": ["product-specific unnatural poses to avoid, e.g. do not hold a toaster at chest height"],
      "starterFrameBrief": "one concise directive for the starter image model describing product placement, creator position, and interaction"
    },
    "physicalUseModel": {
      "physicalForm": "what physical or digital form the product has, e.g. sealed pump bottle, dropper bottle, countertop appliance, wearable accessory, app screen",
      "interactionModel": "how a user naturally interacts with this exact product, e.g. open cap then apply, press lever, snap onto phone, tap screen",
      "activationOrAccessPoint": "the part that must be opened, pressed, tapped, worn, gripped, inserted, pulled, or used first",
      "outputOrEffectSource": "where the visible result, liquid, screen change, heat, movement, texture, fit, or proof should originate",
      "validInteractionPoints": ["specific product parts or surfaces where hands, tools, body, or screen actions may interact"],
      "invalidInteractionPoints": ["specific product parts where action/result must not happen because it would be physically wrong"],
      "requiredPreconditions": ["what must happen before the main action, e.g. cap removed, app screen visible, appliance placed on counter"],
      "naturalUseSequence": ["ordered real-world actions for this product from first frame to proof moment"],
      "failureModesToAvoid": ["physically impossible or unnatural generated motions to prevent"],
      "plannerDirective": "one direct instruction the planner must follow so product motion is physically plausible"
    },
    "primaryUseCase": "what the product is normally used for",
    "naturalUseEnvironments": ["realistic places where this exact product would naturally be used"],
    "typicalUserActions": ["specific physical or screen actions a person naturally performs with this product"],
    "functionalBenefitsToDemonstrate": ["non-medical, non-exaggerated functions or use-feel points that can be shown visually"],
    "visualProofDetails": ["visible details that should be close-up proof points"],
    "copyAngles": ["short sellable angles that match this exact product category, e.g. cute design, better grip, slim protection"],
    "allowedActionVerbs": ["category-correct verbs for speech and motion, e.g. hold, snap on, show, grip"],
    "forbiddenActionVerbs": ["verbs that would sound wrong for this product category, e.g. sip for a phone case, wear for a tumbler"],
    "proofWords": ["category-correct words that can appear in dialogue, e.g. grip, print, lid, glow, texture, app screen"],
    "firstSecondVisualPriority": "what should be visible in the first second to prove the product is the uploaded item",
    "uncertaintyNotes": ["only if product identity or usage is ambiguous from the image"]
  },
  "productVisualLock": {
    "silhouette": "exact outline/proportions to preserve",
    "cameraCutoutOrKeyShape": "distinctive lens/cutout/opening/handle/control/screen/cap/key shape positions",
    "textAndLogoPlacement": ["readable text/logo and where it sits on the product"],
    "graphicElementPlacement": ["specific print, doodle, sticker, pattern, icon, color-block, or design element positions"],
    "colorMaterialRules": ["exact color/material/finish rules, e.g. clear plastic, chrome trim, matte black, translucent glitter"],
    "frontViewReferenceQuality": "how usable this image is as a clean product reference",
    "preservationPrompt": "one strong sentence telling the video model what must not change",
    "backgroundRemovalNotes": ["what is product vs background, and any crop/edge ambiguity"]
  },
  "qualityWarnings": ["only if the image is blurry, cropped, too small, obstructed, or ambiguous"]
}

Rules:
- be literal about visible details; do not invent non-visible claims
- identify the product's real-world physical use before suggesting creator poses
- physicalUseModel is mandatory: infer the product's physical affordances from the image and label, including which part is used first, where results/effects can originate, and which motions would be physically wrong
- do not write generic physicalUseModel values; make validInteractionPoints, invalidInteractionPoints, requiredPreconditions, naturalUseSequence, and failureModesToAvoid specific to the visible product
- if the product is large, heavy, countertop, installed, wearable, or screen-based, starterComposition must not default to "creator holding it at chest height"
- starterComposition must explain where the product should be, where the creator should be, and which poses are physically unnatural
`;
  }

  return `
Analyze this uploaded target avatar/model image for a UGC video generation asset profile.

Return strict JSON only. Do not include markdown.

Schema:
{
  "promptNounPhrase": "short non-identifying character phrase to place immediately before @avatar token, e.g. a woman in her 20s with dark hair in a bun",
  "description": "one sentence visual description focused on age range, hair, outfit, styling, and visible pose",
  "keyDetails": ["face shape, hair color/style, age range, skin tone, outfit/styling, overall look to preserve"],
  "visibleText": [],
  "colors": ["main clothing/hair/background colors if relevant"],
  "qualityWarnings": ["only if the face is unclear, cropped, too small, profile-only, obstructed, or ambiguous"]
}
`;
}

function sniffImageDimensions(bytes: Buffer, mimeType: string): AssetProfile["dimensions"] {
  if (mimeType.includes("png") && bytes.length >= 24 && bytes.toString("ascii", 1, 4) === "PNG") {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20)
    };
  }

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return sniffJpegDimensions(bytes);
  }

  if (mimeType.includes("webp")) {
    return sniffWebpDimensions(bytes);
  }

  return undefined;
}

function sniffJpegDimensions(bytes: Buffer): AssetProfile["dimensions"] {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return undefined;
  }

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return undefined;
    if (offset + 4 >= bytes.length) return undefined;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2) return undefined;

    if (marker >= 0xc0 && marker <= 0xc3 && offset + 8 < bytes.length) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + length;
  }

  return undefined;
}

function sniffWebpDimensions(bytes: Buffer): AssetProfile["dimensions"] {
  if (bytes.length < 30 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    return undefined;
  }

  const chunk = bytes.toString("ascii", 12, 16);

  if (chunk === "VP8X" && bytes.length >= 30) {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3)
    };
  }

  if (chunk === "VP8 " && bytes.length >= 30) {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff
    };
  }

  if (chunk === "VP8L" && bytes.length >= 25) {
    const bits = bytes.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    };
  }

  return undefined;
}

function imageQualityWarnings(
  bytes: Buffer,
  mimeType: string,
  dimensions: AssetProfile["dimensions"]
): string[] {
  const warnings: string[] = [];

  if (!imageMimeTypes.has(mimeType)) {
    warnings.push(`Unsupported or unusual image MIME type: ${mimeType}.`);
  }

  if (bytes.length > 30 * 1024 * 1024) {
    warnings.push("Image is large for reference generation. Compress if uploads or model calls become unstable.");
  }

  if (!dimensions) {
    warnings.push("Image dimensions could not be detected locally.");
    return warnings;
  }

  const ratio = dimensions.width / dimensions.height;
  if (dimensions.width < 300 || dimensions.height < 300) {
    warnings.push("Image is below the recommended 300x300 minimum.");
  }
  if (dimensions.width > 6000 || dimensions.height > 6000) {
    warnings.push("Image is above the common 6000px reference-image dimension limit.");
  }
  if (ratio < 0.4 || ratio > 2.5) {
    warnings.push("Image aspect ratio is unusual for product/model reference generation.");
  }

  return warnings;
}

function videoQualityWarnings(bytes: Buffer, mimeType: string): string[] {
  const warnings: string[] = [];

  if (!["video/mp4", "video/quicktime", "video/mov"].includes(mimeType)) {
    warnings.push(`Unsupported or unusual video MIME type: ${mimeType}.`);
  }

  if (bytes.length > 50 * 1024 * 1024) {
    warnings.push("Reference video is large for Gemini analysis. Compress if analysis uploads become unstable.");
  }

  return warnings;
}

function cleanSentenceFragment(value: string): string {
  return value.trim().replace(/[.。]+$/, "");
}

function compactList(values?: unknown): string[] {
  const list = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? splitListString(values)
      : values && typeof values === "object"
        ? Object.values(values)
        : [];

  return Array.from(
    new Set(
      list
        .flatMap((value) => {
          if (typeof value === "string") return splitListString(value);
          if (typeof value === "number" || typeof value === "boolean") return [String(value)];
          return [];
        })
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function chooseList(...candidates: unknown[]): string[] {
  for (const candidate of candidates) {
    const values = compactList(candidate);

    if (values.length) {
      return values;
    }
  }

  return [];
}

function splitListString(value: string): string[] {
  return value
    .split(/\r?\n|;|\|/)
    .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function fallbackCopyGuardrails(value?: string): Pick<
  ProductUnderstanding,
  "copyAngles" | "allowedActionVerbs" | "forbiddenActionVerbs" | "proofWords"
> {
  const text = (value || "").toLowerCase();

  if (/(phone|iphone|case|cover)/.test(text)) {
    return {
      copyAngles: [
        "cute phone refresh without bulk",
        "protective case that still shows personality",
        "easy grip and clean camera cutout"
      ],
      allowedActionVerbs: ["hold", "snap on", "show", "grip", "turn", "tap", "point to", "match"],
      forbiddenActionVerbs: ["sip", "drink", "taste", "wear", "apply", "unbox serum", "smell"],
      proofWords: ["case", "grip", "print", "camera cutout", "buttons", "edges", "phone", "design"]
    };
  }

  if (/(tumbler|cup|bottle|mug|stanley|straw|lid)/.test(text)) {
    return {
      copyAngles: [
        "daily carry tumbler that is easy to sip",
        "handle and lid convenience",
        "large drink capacity with a clean look"
      ],
      allowedActionVerbs: ["hold", "carry", "sip", "drink", "show", "rotate", "tap", "open", "close"],
      forbiddenActionVerbs: ["wear", "apply", "snap on", "install", "click through", "scroll"],
      proofWords: ["tumbler", "straw", "lid", "handle", "sip", "carry", "cup", "drink"]
    };
  }

  if (/(serum|cream|skincare|beauty|lip|makeup|cleanser|lotion|sunscreen)/.test(text)) {
    return {
      copyAngles: [
        "visible texture and finish",
        "easy application in a real routine",
        "fresh feel without exaggerated claims"
      ],
      allowedActionVerbs: ["apply", "swatch", "tap", "blend", "show", "open", "pump", "smooth"],
      forbiddenActionVerbs: ["sip", "drink", "install", "snap on", "charge", "scroll"],
      proofWords: ["texture", "finish", "glow", "shade", "applicator", "routine", "skin", "formula"]
    };
  }

  if (/(app|software|dashboard|website|platform|tool|saas|screen)/.test(text)) {
    return {
      copyAngles: [
        "simple workflow proof",
        "clear before-and-after task improvement",
        "fast result on screen"
      ],
      allowedActionVerbs: ["open", "tap", "click", "scroll", "show", "compare", "generate", "save"],
      forbiddenActionVerbs: ["sip", "drink", "wear", "apply", "smell", "taste"],
      proofWords: ["app", "screen", "workflow", "dashboard", "result", "button", "demo", "setup"]
    };
  }

  return {
    copyAngles: ["clear visual proof", "easy everyday use", "recognizable product detail"],
    allowedActionVerbs: ["hold", "show", "use", "turn", "point to", "open", "close", "demonstrate"],
    forbiddenActionVerbs: ["make unsupported claims"],
    proofWords: ["detail", "design", "texture", "color", "shape", "use", "proof"]
  };
}

function normalizeStarterComposition(
  value: Partial<StarterComposition> | undefined,
  fallback: Partial<StarterComposition> | undefined,
  productHint?: string
): StarterComposition {
  const source = value ?? fallback ?? {};
  const fallbackValue = fallbackStarterComposition(productHint || "uploaded product");

  return {
    productScale: cleanOrDefault(source.productScale, fallback?.productScale, fallbackValue.productScale),
    naturalPlacement: cleanOrDefault(source.naturalPlacement, fallback?.naturalPlacement, fallbackValue.naturalPlacement),
    creatorPosition: cleanOrDefault(source.creatorPosition, fallback?.creatorPosition, fallbackValue.creatorPosition),
    primaryInteraction: cleanOrDefault(source.primaryInteraction, fallback?.primaryInteraction, fallbackValue.primaryInteraction),
    cameraFraming: cleanOrDefault(source.cameraFraming, fallback?.cameraFraming, fallbackValue.cameraFraming),
    badPoses: compactList(source.badPoses?.length ? source.badPoses : fallback?.badPoses?.length ? fallback.badPoses : fallbackValue.badPoses),
    starterFrameBrief: cleanOrDefault(source.starterFrameBrief, fallback?.starterFrameBrief, fallbackValue.starterFrameBrief)
  };
}

function fallbackStarterComposition(value?: string): StarterComposition {
  const text = (value || "").toLowerCase();

  if (/(toaster|oven|air fryer|blender|coffee maker|kettle|microwave|appliance)/.test(text)) {
    return {
      productScale: "countertop appliance",
      naturalPlacement: "on a kitchen counter or table in the foreground",
      creatorPosition: "standing beside or slightly behind the appliance",
      primaryInteraction: "one hand near the lever, knob, handle, toast slot, or food being prepared",
      cameraFraming: "vertical kitchen UGC frame with product foreground and creator beside it",
      badPoses: ["do not hold the appliance at chest height", "do not treat it like a phone case or tumbler"],
      starterFrameBrief: "Place the appliance on a kitchen counter in the foreground, with the creator beside it and one hand naturally interacting with a lever, knob, handle, or food."
    };
  }

  if (/(phone|iphone|case|cover)/.test(text)) {
    return {
      productScale: "small handheld accessory",
      naturalPlacement: "held near the camera with the back design visible",
      creatorPosition: "selfie-style creator holding the phone or case beside the face",
      primaryInteraction: "grip the edges, angle the back design, or point to the camera cutout",
      cameraFraming: "vertical selfie close-up with product beside face",
      badPoses: ["do not cover the print with fingers", "do not place the case far in the background"],
      starterFrameBrief: "Hold the phone case near face level, angled toward the camera so the back design and camera cutout are clearly visible."
    };
  }

  return {
    productScale: "product size inferred from image",
    naturalPlacement: "in the most realistic use location for this product",
    creatorPosition: "positioned naturally relative to the product",
    primaryInteraction: "one natural first-frame interaction that demonstrates real use",
    cameraFraming: "vertical native UGC frame with product clearly visible",
    badPoses: ["do not force a generic chest-height holding pose if it conflicts with real product use"],
    starterFrameBrief: "Stage the product according to its real-world use: handheld items can be held near camera, while larger, surface-based, wearable, or screen-based products should be shown in their natural context."
  };
}

function fallbackPhysicalUseModel(value?: string): ProductPhysicalUseModel {
  const product = value || "uploaded product";

  return {
    physicalForm: `visible form of ${product}`,
    interactionModel: "Infer the natural interaction from the product image, product label, and visible functional parts.",
    activationOrAccessPoint: "the visible part a real user would naturally open, press, hold, wear, place, tap, grip, or operate first",
    outputOrEffectSource: "the visible part, surface, screen, applicator, opening, worn area, or use context where the product's result should appear",
    validInteractionPoints: ["visible functional parts, edges, controls, openings, screen areas, applicators, handles, or intended contact surfaces"],
    invalidInteractionPoints: ["random body, label, decorative graphic, sealed surface, base, side wall, or non-functional area unless the product image shows it is used there"],
    requiredPreconditions: ["stage the product in its natural use context before showing the main action"],
    naturalUseSequence: ["show product clearly", "interact with the intended functional part", "show visible proof or result"],
    failureModesToAvoid: ["do not make the product behave in a physically impossible way", "do not make results emerge from non-functional product areas"],
    plannerDirective:
      "Before writing the motion prompt, identify the product's intended access point and result source; keep all action and visible effects physically attached to those parts."
  };
}

function normalizeProductUnderstanding(
  value: Partial<ProductUnderstanding> | undefined,
  fallback: Partial<ProductUnderstanding> | undefined
): ProductUnderstanding {
  const source = value ?? fallback ?? {};
  const productHint = source.productType || fallback?.productType || source.productCategory || fallback?.productCategory;
  const guardrails = fallbackCopyGuardrails(productHint);
  const starterComposition = normalizeStarterComposition(source.starterComposition, fallback?.starterComposition, productHint);
  const physicalUseModel = normalizePhysicalUseModel(source.physicalUseModel, fallback?.physicalUseModel, productHint);
  const typicalUserActions = chooseList(source.typicalUserActions, fallback?.typicalUserActions);
  const visualProofDetails = chooseList(source.visualProofDetails, fallback?.visualProofDetails);
  const allowedActionVerbs = chooseList(source.allowedActionVerbs, fallback?.allowedActionVerbs, guardrails.allowedActionVerbs);
  const forbiddenActionVerbs = chooseList(source.forbiddenActionVerbs, fallback?.forbiddenActionVerbs, guardrails.forbiddenActionVerbs);
  const proofWords = chooseList(source.proofWords, fallback?.proofWords, guardrails.proofWords);
  const uncertaintyNotes = chooseList(source.uncertaintyNotes, fallback?.uncertaintyNotes);

  return {
    productType: cleanOrDefault(source.productType, fallback?.productType, "uploaded product"),
    productCategory: cleanOrDefault(source.productCategory, fallback?.productCategory, "unknown"),
    starterComposition,
    physicalUseModel,
    primaryUseCase: cleanOrDefault(
      source.primaryUseCase,
      fallback?.primaryUseCase,
      "Use the product in its normal real-world way."
    ),
    naturalUseEnvironments: compactList(
      source.naturalUseEnvironments?.length ? source.naturalUseEnvironments : fallback?.naturalUseEnvironments
    ),
    typicalUserActions: compactList(
      [...typicalUserActions, ...physicalUseModel.naturalUseSequence]
    ),
    functionalBenefitsToDemonstrate: compactList(
      source.functionalBenefitsToDemonstrate?.length
        ? source.functionalBenefitsToDemonstrate
        : fallback?.functionalBenefitsToDemonstrate
    ),
    visualProofDetails: compactList(
      [
        ...visualProofDetails,
        physicalUseModel.activationOrAccessPoint,
        physicalUseModel.outputOrEffectSource,
        ...physicalUseModel.validInteractionPoints
      ]
    ),
    copyAngles: compactList(
      source.copyAngles?.length ? source.copyAngles : fallback?.copyAngles?.length ? fallback.copyAngles : guardrails.copyAngles
    ),
    allowedActionVerbs: compactList(
      allowedActionVerbs
    ),
    forbiddenActionVerbs: compactList(
      [...forbiddenActionVerbs, ...physicalUseModel.failureModesToAvoid]
    ),
    proofWords: compactList(
      [
        ...proofWords,
        physicalUseModel.activationOrAccessPoint,
        physicalUseModel.outputOrEffectSource,
        ...physicalUseModel.validInteractionPoints
      ]
    ),
    firstSecondVisualPriority: cleanOrDefault(
      source.firstSecondVisualPriority,
      fallback?.firstSecondVisualPriority,
      "Show the uploaded product clearly in the first second."
    ),
    uncertaintyNotes: compactList(
      [...uncertaintyNotes, physicalUseModel.plannerDirective]
    )
  };
}

function normalizePhysicalUseModel(
  value: Partial<ProductPhysicalUseModel> | undefined,
  fallback: Partial<ProductPhysicalUseModel> | undefined,
  productHint?: string
): ProductPhysicalUseModel {
  const source = value ?? fallback ?? {};
  const fallbackValue = fallbackPhysicalUseModel(productHint);

  return {
    physicalForm: cleanOrDefault(source.physicalForm, fallback?.physicalForm, fallbackValue.physicalForm),
    interactionModel: cleanOrDefault(source.interactionModel, fallback?.interactionModel, fallbackValue.interactionModel),
    activationOrAccessPoint: cleanOrDefault(
      source.activationOrAccessPoint,
      fallback?.activationOrAccessPoint,
      fallbackValue.activationOrAccessPoint
    ),
    outputOrEffectSource: cleanOrDefault(
      source.outputOrEffectSource,
      fallback?.outputOrEffectSource,
      fallbackValue.outputOrEffectSource
    ),
    validInteractionPoints: compactList(
      source.validInteractionPoints?.length
        ? source.validInteractionPoints
        : fallback?.validInteractionPoints?.length
          ? fallback.validInteractionPoints
          : fallbackValue.validInteractionPoints
    ),
    invalidInteractionPoints: compactList(
      source.invalidInteractionPoints?.length
        ? source.invalidInteractionPoints
        : fallback?.invalidInteractionPoints?.length
          ? fallback.invalidInteractionPoints
          : fallbackValue.invalidInteractionPoints
    ),
    requiredPreconditions: compactList(
      source.requiredPreconditions?.length
        ? source.requiredPreconditions
        : fallback?.requiredPreconditions?.length
          ? fallback.requiredPreconditions
          : fallbackValue.requiredPreconditions
    ),
    naturalUseSequence: compactList(
      source.naturalUseSequence?.length
        ? source.naturalUseSequence
        : fallback?.naturalUseSequence?.length
          ? fallback.naturalUseSequence
          : fallbackValue.naturalUseSequence
    ),
    failureModesToAvoid: compactList(
      source.failureModesToAvoid?.length
        ? source.failureModesToAvoid
        : fallback?.failureModesToAvoid?.length
          ? fallback.failureModesToAvoid
          : fallbackValue.failureModesToAvoid
    ),
    plannerDirective: cleanOrDefault(source.plannerDirective, fallback?.plannerDirective, fallbackValue.plannerDirective)
  };
}

function normalizeProductVisualLock(
  value: Partial<ProductVisualLock> | undefined,
  fallback: Partial<ProductVisualLock> | undefined,
  context: {
    label: string;
    keyDetails?: string[];
    visibleText?: string[];
    colors?: string[];
  }
): ProductVisualLock {
  const source = value ?? fallback ?? {};
  const keyDetails = compactList(context.keyDetails);
  const visibleText = compactList(context.visibleText);
  const colors = compactList(context.colors);
  const productName = context.label || "uploaded product";

  return {
    silhouette: cleanOrDefault(
      source.silhouette,
      fallback?.silhouette,
      `Preserve the exact visible outline and proportions of ${productName}.`
    ),
    cameraCutoutOrKeyShape: cleanOrDefault(
      source.cameraCutoutOrKeyShape,
      fallback?.cameraCutoutOrKeyShape,
      keyDetails.length
        ? `Preserve distinctive shape markers: ${keyDetails.slice(0, 4).join(", ")}.`
        : "Preserve distinctive product shape markers such as camera cutouts, openings, handles, controls, screens, caps, edges, and corners."
    ),
    textAndLogoPlacement: compactList(
      source.textAndLogoPlacement?.length
        ? source.textAndLogoPlacement
        : fallback?.textAndLogoPlacement?.length
          ? fallback.textAndLogoPlacement
          : visibleText.map((text) => `Keep "${text}" in its uploaded-image position.`)
    ),
    graphicElementPlacement: compactList(
      source.graphicElementPlacement?.length
        ? source.graphicElementPlacement
        : fallback?.graphicElementPlacement?.length
          ? fallback.graphicElementPlacement
          : keyDetails
    ),
    colorMaterialRules: compactList(
      source.colorMaterialRules?.length
        ? source.colorMaterialRules
        : fallback?.colorMaterialRules?.length
          ? fallback.colorMaterialRules
          : colors.map((color) => `Keep ${color} as a visible product color.`)
    ),
    frontViewReferenceQuality: cleanOrDefault(
      source.frontViewReferenceQuality,
      fallback?.frontViewReferenceQuality,
      "Use the uploaded image as the clean product reference and ignore unrelated background."
    ),
    preservationPrompt: cleanOrDefault(
      source.preservationPrompt,
      fallback?.preservationPrompt,
      `Do not redesign ${productName}; preserve its exact silhouette, color, visible text/logo, graphics, and material finish.`
    ),
    backgroundRemovalNotes: compactList(
      source.backgroundRemovalNotes?.length
        ? source.backgroundRemovalNotes
        : fallback?.backgroundRemovalNotes?.length
          ? fallback.backgroundRemovalNotes
          : ["Treat the uploaded product body as the asset and avoid copying unrelated background."]
    )
  };
}

function cleanOrDefault(
  value: string | undefined,
  fallback: string | undefined,
  defaultValue: string
): string {
  const cleaned = value?.trim() || fallback?.trim() || defaultValue;
  return cleanSentenceFragment(cleaned);
}
