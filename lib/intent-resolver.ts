import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CREATOR_ASSET_TOKEN, PRODUCT_ASSET_TOKEN, REFERENCE_VIDEO_ASSET_TOKEN } from "./asset-bindings";
import type { AssetBindingDebug, ProductFocusInput, ReferenceAnalysis, ResolvedIntent } from "./types";
import { getVideoFormat } from "./video-formats";

export function resolveGenerationIntent(
  input: ProductFocusInput,
  analysis: ReferenceAnalysis
): ResolvedIntent {
  const format = getVideoFormat(input.videoFormat);
  const understanding = input.productAssetProfile?.productUnderstanding;
  const visualLock = input.productAssetProfile?.productVisualLock;
  const productType = understanding?.productType || input.productName || "uploaded product";

  return {
    productMode: productModeIntent(input),
    videoFormat: videoFormatIntent(input, analysis),
    productUse: {
      productType,
      primaryUseCase:
        understanding?.primaryUseCase
        || "Use the uploaded product in the most natural real-world way suggested by its image and name.",
      naturalUseEnvironments: nonEmpty(
        understanding?.naturalUseEnvironments,
        ["a realistic everyday setting where the uploaded product would naturally be used"]
      ),
      typicalUserActions: nonEmpty(
        understanding?.typicalUserActions,
        ["hold, handle, operate, wear, apply, open, or demonstrate the product according to its visible type"]
      ),
      visualProofDetails: nonEmpty(
        understanding?.visualProofDetails,
        input.productAssetProfile?.keyDetails?.length
          ? input.productAssetProfile.keyDetails
          : ["shape", "material", "logo or text", "color", "recognizable design details"]
      ),
      copyAngles: nonEmpty(
        understanding?.copyAngles,
        ["clear visual proof", "easy everyday use", "recognizable product detail"]
      ),
      allowedActionVerbs: nonEmpty(
        understanding?.allowedActionVerbs,
        ["hold", "show", "use", "turn", "point to", "open", "demonstrate"]
      ),
      forbiddenActionVerbs: nonEmpty(
        understanding?.forbiddenActionVerbs,
        ["make unsupported claims"]
      ),
      proofWords: nonEmpty(
        understanding?.proofWords,
        ["detail", "design", "texture", "color", "shape", "use", "proof"]
      ),
      firstSecondPriority:
        understanding?.firstSecondVisualPriority
        || "Show the uploaded product clearly in the first second.",
      preservationPriorities: nonEmpty(
        compactStrings([
          visualLock?.preservationPrompt,
          visualLock?.silhouette,
          visualLock?.cameraCutoutOrKeyShape,
          ...(input.productAssetProfile?.keyDetails ?? []),
          ...(input.productAssetProfile?.visibleText ?? []),
          ...(input.productAssetProfile?.colors ?? []),
          ...(visualLock?.textAndLogoPlacement ?? []),
          ...(visualLock?.graphicElementPlacement ?? []),
          ...(visualLock?.colorMaterialRules ?? [])
        ]),
        ["the exact uploaded product appearance"]
      ),
      avoid: nonEmpty(
        [
          ...(understanding?.uncertaintyNotes ?? []),
          ...formatAvoidRules(input.videoFormat),
          input.referenceProductMode === "replace_product"
            ? "do not copy an incompatible source product from the reference video"
            : "do not override uploaded product details when the reference clip conflicts"
        ],
        ["do not show a different product than the uploaded product image"]
      )
    }
  };
}

export function buildAssetBindingDebug(input: ProductFocusInput): AssetBindingDebug {
  const hasAvatar = input.creatorReferenceProvided && input.creatorMode === "model_reference";

  return {
    internalTokens: {
      product: PRODUCT_ASSET_TOKEN,
      avatar: hasAvatar ? CREATOR_ASSET_TOKEN : undefined,
      video: REFERENCE_VIDEO_ASSET_TOKEN
    },
    generationTags: {
      product: hasAvatar ? "@Element2" : "@Element1",
      avatar: hasAvatar ? "@Element1" : undefined,
      video: "Gemini analysis only"
    },
    elementOrder: hasAvatar
      ? ["@Element1 = uploaded model image", "@Element2 = uploaded product image"]
      : ["@Element1 = uploaded product image"],
    referenceVideoHandling: input.generationMode === "fast_ugc"
      ? "No reference video is used in Fast UGC mode."
      : "Reference video is analyzed by Gemini and compiled into text. It is not sent to fal Kling."
  };
}

export async function writeIntentDebug(jobId: string, intent: ResolvedIntent): Promise<void> {
  const logsDir = path.join(process.cwd(), "logs");
  await mkdir(logsDir, { recursive: true });
  await writeFile(
    path.join(logsDir, `intent-resolver-${jobId}.json`),
    JSON.stringify(intent, null, 2),
    "utf8"
  );
}

function productModeIntent(input: ProductFocusInput): ResolvedIntent["productMode"] {
  if (input.referenceProductMode === "same_product") {
    return {
      id: "same_product",
      label: "Same product",
      instruction:
        "Treat the reference video and uploaded product image as the same target product. Preserve matching reference product handling, use order, and proof behavior. The uploaded product image wins on visual conflicts."
    };
  }

  return {
    id: "replace_product",
    label: "Replace product",
    instruction:
      "Use the reference video for structure, camera, pacing, gestures, scene mood, and proof pattern. Replace source-product details with the uploaded product image and product analysis."
  };
}

function videoFormatIntent(
  input: ProductFocusInput,
  analysis: ReferenceAnalysis
): ResolvedIntent["videoFormat"] {
  const format = getVideoFormat(input.videoFormat);
  const usesReference = input.generationMode !== "fast_ugc";
  const base = {
    id: format.id,
    name: format.name,
    intent: format.promptIntent,
    creatorPolicy: "Use the creator only when the selected format benefits from a human demonstration.",
    productPolicy: "The uploaded product must remain visually central.",
    shotRules: [
      "product visible in the first second",
      usesReference
        ? referenceModeShotRule(input)
        : "use the selected video format and product analysis to create a fresh native UGC shot order",
      analysis.earliestClearProductMoment
        ? `preserve an early product reveal like: ${analysis.earliestClearProductMoment}`
        : "open with a clear product reveal",
      analysis.bestProductProofShot
        ? `include a proof/detail moment like: ${analysis.bestProductProofShot}`
        : "include one clear product proof or detail shot"
    ],
    avoid: formatAvoidRules(input.videoFormat)
  };

  if (input.videoFormat === "product_only") {
    return {
      ...base,
      creatorPolicy: "Do not show a visible creator, face, selfie, interview, or talking-head scene.",
      productPolicy: "Use product-only B-roll, macro close-ups, controlled movement, surface, light, texture, packaging, and detail proof.",
      shotRules: [...base.shotRules, "no visible face", "hands only if interaction is needed"]
    };
  }

  if (input.videoFormat === "tutorial") {
    return {
      ...base,
      creatorPolicy: "A creator or hands can demonstrate the product, but the step sequence must be clear.",
      productPolicy: "Show ordered steps: setup, use, close-up proof, result.",
      shotRules: [...base.shotRules, "make the sequence step-by-step", "show the result of the product use"]
    };
  }

  if (input.videoFormat === "unboxing") {
    return {
      ...base,
      creatorPolicy: "Hands or creator may appear, but the opening/reveal action is the main subject.",
      productPolicy: "Show package, opening, reveal, first touch, close detail, and final product view.",
      shotRules: [...base.shotRules, "include an opening or reveal moment", "show packaging and product detail"]
    };
  }

  if (input.videoFormat === "ugc_virtual_try_on") {
    return {
      ...base,
      creatorPolicy: "The creator and product should share attention because fit, styling, wear, or application is the proof.",
      productPolicy: "The product must be visibly worn, applied, fitted, paired, or styled when appropriate.",
      shotRules: [...base.shotRules, "show before/held detail", "show worn/applied/styled result"]
    };
  }

  if (input.videoFormat === "app_ugc" || input.videoFormat === "app_split_demo") {
    return {
      ...base,
      creatorPolicy: "Use creator reaction only if it supports the app or screen workflow.",
      productPolicy: "Treat the app, screen, interface, or workflow as the product proof.",
      shotRules: [...base.shotRules, "show screen workflow", "show one clear interface/result proof"]
    };
  }

  if (input.videoFormat === "before_after") {
    return {
      ...base,
      creatorPolicy: "Creator may appear only if needed to make the comparison believable.",
      productPolicy: "Show before state, product use or interaction, and after state/result.",
      shotRules: [...base.shotRules, "show before and after contrast", "avoid unsupported claims"]
    };
  }

  return {
    ...base,
    creatorPolicy:
      "Creator-led UGC is allowed, but the model reference is identity-only: do not copy its photo background, pose, outfit, or static composition. Use the reference video for wardrobe style, background, body action, framing, and pacing when product-appropriate.",
    productPolicy:
      "Prioritize product close-ups, product-in-hand shots, texture/material shots, label/package shots, and actual use over face-only shots."
  };
}

function formatAvoidRules(formatId: ProductFocusInput["videoFormat"]): string[] {
  const common = [
    "do not open with a generic face-only intro",
    "do not invent product claims that are not visually provable",
    "do not hide the product during the first second"
  ];

  if (formatId === "product_only") {
    return [...common, "do not include a visible creator"];
  }

  if (formatId === "unboxing") {
    return [...common, "do not skip the reveal/opening action"];
  }

  if (formatId === "tutorial") {
    return [...common, "do not make the steps vague or out of order"];
  }

  return common;
}

function referenceModeShotRule(input: ProductFocusInput): string {
  if (input.generationMode === "winning_ad_remix") {
    return "use the reference video for hook structure, cut order, product reveal timing, proof shot timing, pacing, and CTA structure";
  }

  return "use the reference video for camera framing, pacing, gesture style, scene mood, and shot order";
}

function nonEmpty(values: string[] | undefined, fallback: string[]): string[] {
  const compact = (values ?? []).map((value) => value.trim()).filter(Boolean);
  return compact.length ? Array.from(new Set(compact)) : fallback;
}

function compactStrings(values: Array<string | undefined>): string[] {
  return values.map((value) => value?.trim()).filter(Boolean) as string[];
}
