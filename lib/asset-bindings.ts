export const PRODUCT_ASSET_TOKEN = "@product:target_product";
export const CREATOR_ASSET_TOKEN = "@avatar:target_creator";
export const REFERENCE_VIDEO_ASSET_TOKEN = "@video:reference_motion";

type ResolvedAssetTags = {
  productTag: string;
  creatorTag?: string;
  referenceVideoTag?: string;
};

export type CompiledAssetPrompt = {
  prompt: string;
  warnings: string[];
  tokenCounts: {
    product: number;
    avatar: number;
    video: number;
  };
};

const productTokenPattern = /@product:[A-Za-z0-9_-]+/g;
const avatarTokenPattern = /@avatar:[A-Za-z0-9_-]+/g;
const videoTokenPattern = /@video:[A-Za-z0-9_-]+/g;

export function resolveAssetBindingTokens(prompt: string, tags: ResolvedAssetTags): string {
  return prompt
    .replace(productTokenPattern, tags.productTag)
    .replace(avatarTokenPattern, tags.creatorTag ?? "a newly generated creator")
    .replace(videoTokenPattern, tags.referenceVideoTag ?? "the reference analysis");
}

export function compileAssetBoundPrompt(prompt: string, tags: ResolvedAssetTags): CompiledAssetPrompt {
  const tokenCounts = {
    product: prompt.match(productTokenPattern)?.length ?? 0,
    avatar: prompt.match(avatarTokenPattern)?.length ?? 0,
    video: prompt.match(videoTokenPattern)?.length ?? 0
  };
  const warnings: string[] = [];

  if (tags.productTag && tokenCounts.product === 0) {
    warnings.push("Asset compiler did not find a @product token in the planner prompt.");
  }
  if (tags.creatorTag && tokenCounts.avatar === 0) {
    warnings.push("Asset compiler did not find a @avatar token in the planner prompt.");
  }
  if (tags.referenceVideoTag && tokenCounts.video === 0) {
    warnings.push("Asset compiler did not find a @video token in the planner prompt.");
  }
  if (tokenCounts.product > 1) {
    warnings.push("Planner repeated @product tokens; keep product asset binding to the first product noun phrase.");
  }
  if (tokenCounts.avatar > 1) {
    warnings.push("Planner repeated @avatar tokens; keep avatar asset binding to the first character noun phrase.");
  }
  if (tokenCounts.video > 1) {
    warnings.push("Planner repeated @video tokens; reference-video asset tokens should not appear in visible prompts.");
  } else if (tokenCounts.video === 1 && !tags.referenceVideoTag) {
    warnings.push("Planner included a @video token; replaced it with reference-analysis wording before fal submission.");
  }

  return {
    prompt: resolveAssetBindingTokens(prompt, tags),
    warnings,
    tokenCounts
  };
}
