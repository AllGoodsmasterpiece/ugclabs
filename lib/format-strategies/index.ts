import type { VideoFormatId } from "../video-formats";
import { appSplitDemoStrategy } from "./app-split-demo";
import { appUgcStrategy } from "./app-ugc";
import { beforeAfterStrategy } from "./before-after";
import { productOnlyStrategy } from "./product-only";
import { tryOnStrategy } from "./try-on";
import { tutorialStrategy } from "./tutorial";
import { unboxingStrategy } from "./unboxing";
import type { FormatStrategy } from "./types";

const strategies = {
  app_split_demo: appSplitDemoStrategy,
  app_ugc: appUgcStrategy,
  before_after: beforeAfterStrategy,
  product_only: productOnlyStrategy,
  tutorial: tutorialStrategy,
  ugc_virtual_try_on: tryOnStrategy,
  unboxing: unboxingStrategy
} satisfies Partial<Record<VideoFormatId, FormatStrategy>>;

export function getNonUgcFormatStrategy(formatId: VideoFormatId): FormatStrategy | undefined {
  if (formatId === "ugc_beauty_product") {
    return undefined;
  }

  return strategies[formatId];
}

export type { FormatStrategy } from "./types";
