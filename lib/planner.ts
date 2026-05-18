import { CREATOR_ASSET_TOKEN, PRODUCT_ASSET_TOKEN, REFERENCE_VIDEO_ASSET_TOKEN } from "./asset-bindings";
import { optionalEnv, requireEnv } from "./env";
import { getNonUgcFormatStrategy, type FormatStrategy } from "./format-strategies";
import { resolveGenerationIntent } from "./intent-resolver";
import { extractJsonObject } from "./json";
import type { CreativePlan, ProductFocusInput, ReferenceAnalysis, ResolvedIntent } from "./types";
import { getUgcTemplateStyle } from "./video-formats";

type PlannerResponse = {
  variants: CreativePlan[];
};

type OpenAIResponse = {
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

export async function createProductFocusPlans(
  analysis: ReferenceAnalysis,
  input: ProductFocusInput,
  resolvedIntent?: ResolvedIntent
): Promise<CreativePlan[]> {
  const intent = resolvedIntent ?? resolveGenerationIntent(input, analysis);
  const prompt = buildComposerPrompt(analysis, input, intent);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for Product Selling Plan and Prompt Composer.");
  }

  return createWithOpenAI(prompt);
}

async function createWithOpenAI(prompt: string): Promise<CreativePlan[]> {
  const model = optionalEnv("OPENAI_PLANNER_MODEL", "gpt-5.4-mini");
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
              text: prompt
            }
          ]
        }
      ]
    })
  });

  const json = (await response.json()) as OpenAIResponse;

  if (!response.ok) {
    throw new Error(`OpenAI prompt composer failed: ${json.error?.message ?? JSON.stringify(json)}`);
  }

  const text =
    json.output_text ??
    json.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("\n") ??
    "";

  return extractJsonObject<PlannerResponse>(text).variants.map(sanitizeCreativePlan);
}

function sanitizeCreativePlan(plan: CreativePlan): CreativePlan {
  return {
    ...plan,
    generationPrompt: stripVisibleReferenceVideoTokens(plan.generationPrompt)
  };
}

function stripVisibleReferenceVideoTokens(prompt: string): string {
  return prompt
    .replace(/\s*@video:[A-Za-z0-9_-]+\s*/gi, " ")
    .replace(/\s*@Video\d+\s*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function buildComposerPrompt(
  analysis: ReferenceAnalysis,
  input: ProductFocusInput,
  intent: ResolvedIntent
): string {
  const formatStrategy = getNonUgcFormatStrategy(input.videoFormat);

  if (formatStrategy) {
    return buildFormatStrategyComposerPrompt(analysis, input, intent, formatStrategy);
  }

  return `
You are UGCLabs' Prompt Composer.

Create ${input.count} fal Kling-ready short-form UGC video prompt variants.

Layer model:
1. Reference Video Analysis: Gemini extracted the reference clip's cut order, framing, product timing, gestures, tone/tempo, and hook structure.
2. Product Analysis: OpenAI extracted what the product is, where/how it is used, what benefits to show, what details to preserve, and the first-second priority.
3. Avatar Analysis: OpenAI extracted creator face identity and age range when a model image exists.
4. Product Selling Plan: decide what benefit to say, what function to show, what proof shot to include, and how to end.
5. Prompt Composer: combine the four layers into one compact Higgsfield-style scene prompt per variant.

User Intent:
- Generation mode: ${generationModeLabel(input)}
- Product relationship mode: ${intent.productMode.label}
- Product mode instruction: ${intent.productMode.instruction}
- Video format: ${intent.videoFormat.name}
- Video format intent: ${intent.videoFormat.intent}
${formatSubFormatIntent(input)}
- Duration: ${input.duration}s
- Audio mode: fal Kling native audio, generate_audio=true
- Creator/model setting: ${creatorModeLabel(input)}
- Model reference image provided: ${input.creatorReferenceProvided ? "yes" : "no"}
- Product name: ${input.productName}
- Product analysis mode: ${input.productAnalysisMode}
- User product feature/use notes: ${input.productFeatureNotes || "not provided"}

Asset Binding:
- Product token: ${PRODUCT_ASSET_TOKEN}
- Avatar token: ${input.creatorReferenceProvided ? CREATOR_ASSET_TOKEN : "not provided"}
- Reference video token: do not use ${REFERENCE_VIDEO_ASSET_TOKEN} in generationPrompt; reference video only informs the text content.
- The request wrapper will compile product/avatar internal tokens to fal Kling @Element1/@Element2 references. Do not write @Image1, @Image2, @Video1, or any @video token yourself.

Product Asset Understanding:
${formatProductAsset(input)}

Product Use Director:
${formatProductUseDirector(input)}
${formatUgcTemplateStyleBlock(input)}

Avatar Asset Understanding:
${formatAvatarAsset(input)}

Reference Video Analysis:
${JSON.stringify(analysis, null, 2)}

Reference Shot Planner Output:
${formatShotPlan(analysis)}

Motion Choreography:
${formatMotionChoreography(analysis)}

Intent Resolver Output:
${JSON.stringify(intent, null, 2)}

Hard rules:
- Return strict JSON only.
- Each generationPrompt must be 1400 characters or less because fal Kling rejects prompts above 2500 characters after compiler binding is added.
- Write generationPrompt as one natural Higgsfield-style paragraph plus an optional short Dialogue line. Do not use section headings.
- Put product/avatar asset tokens inline next to the noun phrase they bind to, like: "A young female creator ${input.creatorReferenceProvided ? CREATOR_ASSET_TOKEN : ""} sits..." and "holding the product ${PRODUCT_ASSET_TOKEN}...".
- Use each product/avatar internal token at most once: one ${PRODUCT_ASSET_TOKEN}, one ${CREATOR_ASSET_TOKEN} when available.
- Never include ${REFERENCE_VIDEO_ASSET_TOKEN}, @video:reference_motion, @video:anything, @Video1, or any visible reference-video asset token in generationPrompt.
- Do not start the prompt with an asset token or a system-like binding sentence.
- After the inline token-bound mention, use natural phrases such as "the product", "the tumbler", "the creator", "she", "her hands", or "the app screen".
- Product visible in the first second.
- The uploaded product image controls exact appearance: shape, color, material, text, logo placement, packaging, and visible design details.
- Treat the product visual lock as mandatory. Do not invent extra prints, logos, charms, colors, camera cutouts, controls, or decorative elements that are not in the uploaded product image.
- Treat Product Use Director as mandatory for product placement and physical interaction. It decides whether the product is handheld, on a surface, worn, applied, screen-based, installed, or interacted with beside the creator.
- If Reference Shot Planner or Motion Choreography conflicts with Product Use Director, preserve the reference lighting/mood/camera feel but adapt the pose/action to Product Use Director.
- Never force every product into a generic chest-height holding pose. Use Product Use Director's naturalPlacement, creatorPosition, primaryInteraction, cameraFraming, badPoses, and starterFrameBrief.
- Follow the Reference Shot Planner Output in order. Do not summarize it into a generic UGC scene.
- Follow Motion Choreography as the primary movement plan when present. Preserve each beat's cameraDistance, handAction, faceAction, productVisibilityRule, mustKeepVisible, and dialogueBeat.
- In Fast UGC mode, no reference video exists; use the selected video format, product analysis, and natural UGC conventions instead of pretending a reference clip exists.
- In Reference Match mode, preserve style, framing, mood, pacing, gestures, and product proof pattern without copying source identity or incompatible source product details.
- In Winning Ad Remix mode, preserve the reference ad's hook structure, cut order, product reveal timing, proof moment, objection handling, and CTA structure more strictly while still replacing the source identity/product.
- Preserve each shot's timing, framing, product scale, product position, hand/creator action, and camera motion as closely as possible within ${input.duration}s.
- If a model image is provided, the uploaded avatar image controls creator identity and styling.
- If a model image is provided, use it for creator face identity only. Do not copy the model image background, pose, outfit, or static photo composition.
- If a model image is provided, never name or describe the uploaded avatar image's clothing, outfit color, accessories, pose, room, wall, or photo background in generationPrompt.
- When an approved starter frame is used, the starter frame controls opening wardrobe, background, pose, product placement, and first-frame composition. Do not contradict it with avatar-photo clothing or background details.
- Wardrobe, pose, hand action, camera framing, and background should come from the reference video analysis unless the product context makes that impossible.
- Hair color and face identity should stay close to the avatar image, but hairstyle may adapt toward the reference video if needed for the scene.
- Background should follow the reference video scene/mood when product-appropriate. Product use environment only beats source-video background when they conflict.
- Avoid unsupported claims, fake testimonials, medical promises, or income promises.
- Create the product selling plan internally before writing the prompt: choose one clear benefit, one visual proof moment, one natural use action, and one short CTA/end beat.
- The spoken lines must sell the uploaded product naturally, not just describe the shot.
- Dialogue must match the product category exactly. Use only category-correct verbs and proof words from Product use rules.
- Do not use forbidden product verbs from Product use rules. For example, never say "fit" for a phone case unless the product is being installed or fitted; never say "sip" for non-drinkware; never say "apply" for non-beauty products.
- The hook, voiceoverScript, and Dialogue line must share the same product selling angle and must not contradict the visible product type.

Same/Replace product rules:
- Same product mode: preserve reference product handling, use order, demonstration behavior, and proof moments when they match the uploaded product image/profile. Uploaded product image wins on conflicts.
- Replace product mode: use the reference video only for structure, framing, pacing, gestures, mood, and proof pattern. Replace incompatible source-product details and source-product actions with product actions inferred from the uploaded product image/profile.

Video format rules:
- Creator policy: ${intent.videoFormat.creatorPolicy}
- Product policy: ${intent.videoFormat.productPolicy}
- Shot rules: ${intent.videoFormat.shotRules.join(" / ")}
- Avoid: ${intent.videoFormat.avoid.join(" / ")}

Product use rules:
- Product type: ${intent.productUse.productType}
- Primary use case: ${intent.productUse.primaryUseCase}
- Natural environments: ${intent.productUse.naturalUseEnvironments.join(" / ")}
- Typical user actions: ${intent.productUse.typicalUserActions.join(" / ")}
- Visual proof details: ${intent.productUse.visualProofDetails.join(" / ")}
- Copy angles: ${intent.productUse.copyAngles.join(" / ")}
- Allowed action verbs: ${intent.productUse.allowedActionVerbs.join(" / ")}
- Forbidden action verbs: ${intent.productUse.forbiddenActionVerbs.join(" / ")}
- Proof words: ${intent.productUse.proofWords.join(" / ")}
- First-second priority: ${intent.productUse.firstSecondPriority}
- Preservation priorities: ${intent.productUse.preservationPriorities.join(" / ")}
- Avoid: ${intent.productUse.avoid.join(" / ")}
- Product Use Director starter frame brief: ${input.productAssetProfile?.productUnderstanding?.starterComposition?.starterFrameBrief || "not available"}

fal Kling prompt style:
One compact paragraph:
"A young stylish female creator ${input.creatorReferenceProvided ? CREATOR_ASSET_TOKEN : ""} is in [reference-video-like background, lighting, wardrobe style]. She records selfie-style, holding the [exact product noun] ${PRODUCT_ASSET_TOKEN} close to camera. [Motion from shot plan: rotate/show/tap/sip/use/demo]. Camera has [reference framing and movement]. She speaks naturally with synced mouth movement. Dialogue: \"short natural line.\""

Prompt content requirements:
- Include reference-video-like background, wardrobe style, pose/action, camera framing, and pacing.
- Include product-specific action and selling proof from Product use rules.
- Include Product Use Director placement/interaction in the first two action beats.
- Include the most important motionChoreography beats as concise action phrases, especially productVisibilityRule and mustKeepVisible.
- Include no more than ${maxPromptShots(input.duration)} action beats.
- Dialogue must fit ${input.duration}s and stay under 20 words total for 5s, under 35 words for 10s, under 50 words for 15s.
- Dialogue must use at least one proof word when natural and must avoid every forbidden action verb.

Schema:
{
  "variants": [
    {
      "index": 1,
      "hook": "short on-screen hook",
      "voiceoverScript": "short natural script or native speech line under the target duration",
      "generationPrompt": "compact Higgsfield-style paragraph under 1400 chars with inline asset tokens beside creator/product nouns",
      "caption": "short caption text"
    }
  ]
}
`;
}

function buildFormatStrategyComposerPrompt(
  analysis: ReferenceAnalysis,
  input: ProductFocusInput,
  intent: ResolvedIntent,
  strategy: FormatStrategy
): string {
  return `
You are UGCLabs' Prompt Composer.

Create ${input.count} fal Kling-ready short-form video prompt variants for the selected non-UGC format.

Important routing rule:
- The stable UGC prompt path is frozen and is not used here.
- This prompt is only for non-UGC formats that need their own director, starter policy, planner policy, renderer hint, and safety rules.

Layer model:
1. Reference Video Analysis: Gemini extracted the reference clip's cut order, framing, product timing, gestures, tone/tempo, and hook structure.
2. Product Analysis: OpenAI extracted what the product is, where/how it is used, what benefits to show, what details to preserve, and the first-second priority.
3. Product Use Director: decides physical product placement and interaction.
4. Format Director: ${strategy.directorName} adapts the common layers to the selected video format.
5. Prompt Composer: produce one compact generation prompt that follows the format-specific production grammar.

User Intent:
- Generation mode: ${generationModeLabel(input)}
- Product relationship mode: ${intent.productMode.label}
- Product mode instruction: ${intent.productMode.instruction}
- Video format: ${intent.videoFormat.name}
- Video format intent: ${intent.videoFormat.intent}
${formatSubFormatIntent(input)}
- Duration: ${input.duration}s
- Audio mode: fal Kling native audio, generate_audio=true
- Creator/model setting: ${creatorModeLabel(input)}
- Model reference image provided: ${input.creatorReferenceProvided ? "yes" : "no"}
- Product name: ${input.productName}
- Product analysis mode: ${input.productAnalysisMode}
- User product feature/use notes: ${input.productFeatureNotes || "not provided"}

Asset Binding:
- Product token: ${PRODUCT_ASSET_TOKEN}
- Avatar token: ${input.creatorReferenceProvided ? CREATOR_ASSET_TOKEN : "not provided"}
- Reference video token: do not use ${REFERENCE_VIDEO_ASSET_TOKEN} in generationPrompt; reference video only informs the text content.
- The request wrapper will compile product/avatar internal tokens to fal Kling @Element1/@Element2 references. Do not write @Image1, @Image2, @Video1, or any @video token yourself.

Product Asset Understanding:
${formatProductAsset(input)}

Product Use Director:
${formatProductUseDirector(input)}

Avatar Asset Understanding:
${formatAvatarAsset(input)}

Reference Video Analysis:
${JSON.stringify(analysis, null, 2)}

Reference Shot Planner Output:
${formatShotPlan(analysis)}

Motion Choreography:
${formatMotionChoreography(analysis)}

Intent Resolver Output:
${JSON.stringify(intent, null, 2)}

Format Strategy:
${formatStrategyBlock(strategy)}
${formatUgcTemplateStyleBlock(input)}

Hard rules:
- Return strict JSON only.
- Each generationPrompt must be 1400 characters or less because fal Kling rejects prompts above 2500 characters after compiler binding is added.
- Write generationPrompt as one natural compact paragraph plus an optional short Dialogue line. Do not use section headings.
- Use the product internal token exactly once, inline next to the product noun phrase, like "the uploaded product ${PRODUCT_ASSET_TOKEN}".
- Use the avatar internal token at most once, and only if the selected format strategy allows or benefits from a visible creator.
- Never include ${REFERENCE_VIDEO_ASSET_TOKEN}, @video:reference_motion, @video:anything, @Video1, or any visible reference-video asset token in generationPrompt.
- Do not start the prompt with an asset token or a system-like binding sentence.
- Product visible in the first second unless the format strategy explicitly requires a covered-package reveal; even then the uploaded product must be revealed quickly.
- The uploaded product image controls exact appearance: shape, color, material, text, logo placement, packaging, and visible design details.
- Treat the product visual lock as mandatory. Do not invent extra prints, logos, charms, colors, camera cutouts, controls, or decorative elements that are not in the uploaded product image.
- Treat Product Use Director as mandatory for product placement and physical interaction.
- Treat Format Director as mandatory for the selected format's production grammar.
- If Reference Shot Planner or Motion Choreography conflicts with Product Use Director or Format Director, preserve the reference lighting/mood/camera feel but adapt pose/action to the product and format.
- Follow the Reference Shot Planner Output in order, but translate incompatible creator or source-product actions into the selected format's director behavior.
- Follow Motion Choreography as the movement source when compatible. Preserve cameraDistance, handAction, faceAction, productVisibilityRule, mustKeepVisible, and dialogueBeat by adapting them to the format.
- In Reference Match mode, preserve style, framing, mood, pacing, gestures, and product proof pattern without copying source identity or incompatible source product details.
- In Winning Ad Remix mode, preserve hook structure, cut order, product reveal timing, proof moment, objection handling, and CTA structure more strictly while still replacing the source identity/product.
- If a model image is provided, the uploaded avatar image controls creator face identity only. Do not copy the model image background, pose, outfit, or static photo composition.
- When an approved starter frame is used, the starter frame controls opening wardrobe, background, pose, product placement, and first-frame composition. Do not contradict it with avatar-photo clothing or background details.
- Dialogue must match the product category exactly. Use only category-correct verbs and proof words from Product use rules.
- Do not use forbidden product verbs from Product use rules.
- Avoid unsupported claims, fake testimonials, medical promises, income promises, or unverifiable before/after claims.

Format-specific rules:
- Director: ${strategy.directorName}
- Layer purpose: ${strategy.layerPurpose}
- Starter policy: ${strategy.starterPolicy}
- Renderer hint: ${strategy.renderer}
- Priority order: ${strategy.priority.join(" / ")}
- Eligibility: ${strategy.eligibilityRules.join(" / ")}
- Required beats: ${strategy.requiredBeats.join(" / ")}
- Planner rules: ${strategy.plannerRules.join(" / ")}
- Dialogue rules: ${strategy.dialogueRules.join(" / ")}
- Safety rules: ${strategy.safetyRules.join(" / ")}
- Avoid: ${strategy.avoidRules.join(" / ")}
- Prompt frame: ${strategy.promptFrame}

Same/Replace product rules:
- Same product mode: preserve reference product handling, use order, demonstration behavior, and proof moments when they match the uploaded product image/profile. Uploaded product image wins on conflicts.
- Replace product mode: use the reference video only for structure, framing, pacing, gestures, mood, and proof pattern. Replace incompatible source-product details and source-product actions with product actions inferred from the uploaded product image/profile.

Product use rules:
- Product type: ${intent.productUse.productType}
- Primary use case: ${intent.productUse.primaryUseCase}
- Natural environments: ${intent.productUse.naturalUseEnvironments.join(" / ")}
- Typical user actions: ${intent.productUse.typicalUserActions.join(" / ")}
- Visual proof details: ${intent.productUse.visualProofDetails.join(" / ")}
- Copy angles: ${intent.productUse.copyAngles.join(" / ")}
- Allowed action verbs: ${intent.productUse.allowedActionVerbs.join(" / ")}
- Forbidden action verbs: ${intent.productUse.forbiddenActionVerbs.join(" / ")}
- Proof words: ${intent.productUse.proofWords.join(" / ")}
- First-second priority: ${intent.productUse.firstSecondPriority}
- Preservation priorities: ${intent.productUse.preservationPriorities.join(" / ")}
- Product Use Director starter frame brief: ${input.productAssetProfile?.productUnderstanding?.starterComposition?.starterFrameBrief || "not available"}

Prompt content requirements:
- Start from the Format Director prompt frame, not from generic creator-led UGC.
- Include product-specific action and selling proof from Product use rules.
- Include Product Use Director placement/interaction in the first two action beats unless the format strategy explicitly says template-first or product-only.
- Include the most important motionChoreography beats as concise action phrases, especially productVisibilityRule and mustKeepVisible.
- Include no more than ${maxPromptShots(input.duration)} action beats.
- Dialogue must fit ${input.duration}s and stay under 20 words total for 5s, under 35 words for 10s, under 50 words for 15s.

Schema:
{
  "variants": [
    {
      "index": 1,
      "hook": "short on-screen hook",
      "voiceoverScript": "short natural script or native speech line under the target duration",
      "generationPrompt": "compact format-specific paragraph under 1400 chars with inline asset tokens beside allowed creator/product nouns",
      "caption": "short caption text"
    }
  ]
}
`;
}

function formatStrategyBlock(strategy: FormatStrategy): string {
  return JSON.stringify({
    id: strategy.id,
    directorName: strategy.directorName,
    layerPurpose: strategy.layerPurpose,
    priority: strategy.priority,
    starterPolicy: strategy.starterPolicy,
    renderer: strategy.renderer,
    eligibilityRules: strategy.eligibilityRules,
    requiredBeats: strategy.requiredBeats,
    plannerRules: strategy.plannerRules,
    dialogueRules: strategy.dialogueRules,
    safetyRules: strategy.safetyRules,
    avoidRules: strategy.avoidRules,
    promptFrame: strategy.promptFrame
  }, null, 2);
}

function formatUgcTemplateStyleBlock(input: ProductFocusInput): string {
  const style = getUgcTemplateStyle(input.ugcTemplateStyle);

  if (!style) {
    return "";
  }

  if (!style.appliesTo.includes(input.videoFormat)) {
    return "";
  }

  return `
UGC Template Style:
${JSON.stringify({
  id: style.id,
  name: style.name,
  explanation: style.explanation,
  promptBias: style.promptBias,
  avoid: style.avoid,
  priorityRule:
    "Use this as a soft creative bias only. Product Analysis, Product Use Director, product visual lock, physicalUseModel, and selected video format rules still have higher priority."
}, null, 2)}
`;
}

function formatSubFormatIntent(input: ProductFocusInput): string {
  if (!input.subFormatName && !input.subFormatIntent) {
    return "- Sub format: not specified";
  }

  return `- Sub format: ${input.subFormatName ?? "Selected sub format"}
- Sub format intent: ${input.subFormatIntent ?? "Use the selected sub format as the primary creative structure."}`;
}

function creatorModeLabel(input: ProductFocusInput): string {
  if (input.creatorMode === "model_reference") return "Use model reference image";
  if (input.creatorMode === "new_creator") return "New creator";
  if (input.creatorMode === "hand_only") return "Hand only";
  return "Auto creator";
}

function generationModeLabel(input: ProductFocusInput): string {
  if (input.generationMode === "winning_ad_remix") {
    return "Winning Ad Remix - preserve the proven ad structure while replacing model/product.";
  }

  if (input.generationMode === "reference_match") {
    return "Reference Match - use the reference clip for style, scene, pacing, and motion.";
  }

  return "Fast UGC - no reference video; create from product analysis and selected format.";
}

function formatProductAsset(input: ProductFocusInput): string {
  const profile = input.productAssetProfile;
  if (!profile) return "not provided";

  return JSON.stringify({
    id: profile.id,
    token: profile.token,
    label: profile.label,
    userFeatureNotes: input.productFeatureNotes || undefined,
    analysisMode: input.productAnalysisMode,
    promptNounPhrase: profile.promptNounPhrase,
    description: profile.description,
    keyDetails: profile.keyDetails,
    visibleText: profile.visibleText,
    colors: profile.colors,
    productUnderstanding: profile.productUnderstanding,
    productVisualLock: profile.productVisualLock,
    dimensions: profile.dimensions,
    qualityWarnings: profile.qualityWarnings
  }, null, 2);
}

function formatAvatarAsset(input: ProductFocusInput): string {
  const profile = input.creatorAssetProfile;
  if (!profile) return "not provided";

  return JSON.stringify({
    id: profile.id,
    token: profile.token,
    label: profile.label,
    promptNounPhrase: profile.promptNounPhrase,
    usageRule: "Use this avatar only for face identity, age range, skin tone, hair identity, and overall facial likeness. Do not copy clothing, outfit color, accessories, pose, room, wall, or photo background into the generationPrompt.",
    identityDetails: avatarIdentityDetails(profile.keyDetails),
    visibleText: profile.visibleText,
    dimensions: profile.dimensions,
    qualityWarnings: profile.qualityWarnings
  }, null, 2);
}

function avatarIdentityDetails(details: string[]): string[] {
  const blocked = /\b(outfit|clothing|shirt|top|tank|dress|jacket|hoodie|sweater|pants|skirt|bag|purse|background|wall|room|pose|standing|sitting|pink|white|black|striped)\b/i;
  const identity = details.filter((detail) => !blocked.test(detail));

  return identity.length
    ? identity
    : ["face identity", "age range", "face shape", "skin tone", "hair identity", "overall facial likeness"];
}

function formatProductUseDirector(input: ProductFocusInput): string {
  const composition = input.productAssetProfile?.productUnderstanding?.starterComposition;
  const physicalUseModel = input.productAssetProfile?.productUnderstanding?.physicalUseModel;

  if (!composition && !physicalUseModel) {
    return "not available. Infer product placement and physical motion from product type, typical user actions, and visual proof details.";
  }

  return JSON.stringify({
    starterComposition: composition
      ? {
          productScale: composition.productScale,
          naturalPlacement: composition.naturalPlacement,
          creatorPosition: composition.creatorPosition,
          primaryInteraction: composition.primaryInteraction,
          cameraFraming: composition.cameraFraming,
          badPoses: composition.badPoses,
          starterFrameBrief: composition.starterFrameBrief
        }
      : undefined,
    physicalUseModel,
    priorityRule:
      "This director controls product placement and physically plausible product motion. If reference-video pose or motion conflicts with this product-use direction, adapt the reference motion to the product's valid access points, result source, natural sequence, and failure modes to avoid."
  }, null, 2);
}

function formatShotPlan(analysis: ReferenceAnalysis): string {
  if (!analysis.shotPlan?.length) {
    return "No structured shotPlan was returned. Use sceneSummary, earliestClearProductMoment, bestProductProofShot, productExposureMoments, and pacingNotes as fallback.";
  }

  return analysis.shotPlan
    .map((shot, index) => {
      const window = `${shot.start || `${index}s`}-${shot.end || `${index + 1}s`}`;
      return [
        `${window}:`,
        `framing=${shot.cameraFraming}`,
        `productPosition=${shot.productPosition}`,
        `productScale=${shot.productScale}`,
        `action=${shot.handOrCreatorAction}`,
        `cameraMotion=${shot.cameraMotion}`,
        `dialogueOrExpression=${shot.dialogueOrExpression}`,
        `preserve=${shot.preserveForGeneration}`
      ].join(" ");
    })
    .join("\n");
}

function formatMotionChoreography(analysis: ReferenceAnalysis): string {
  if (!analysis.motionChoreography?.length) {
    return "No motionChoreography returned. Use shotPlan and product use rules as fallback.";
  }

  return analysis.motionChoreography
    .map((beat, index) => {
      const window = `${beat.start || `${index}s`}-${beat.end || `${index + 1}s`}`;
      return [
        `${window}:`,
        `cameraDistance=${beat.cameraDistance}`,
        `handAction=${beat.handAction}`,
        `faceAction=${beat.faceAction}`,
        `productVisibilityRule=${beat.productVisibilityRule}`,
        `mustKeepVisible=${beat.mustKeepVisible.join(", ")}`,
        `dialogueBeat=${beat.dialogueBeat}`
      ].join(" ");
    })
    .join("\n");
}

function maxPromptShots(duration: ProductFocusInput["duration"]): string {
  if (duration === 5) return "3";
  if (duration === 10) return "4";
  return "5";
}
