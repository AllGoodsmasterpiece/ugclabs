export type VideoFormatId =
  | "ugc_virtual_try_on"
  | "ugc_beauty_product"
  | "tutorial"
  | "unboxing"
  | "product_only"
  | "app_ugc"
  | "app_split_demo"
  | "before_after";

export type VideoFormat = {
  id: VideoFormatId;
  name: string;
  shortDescription: string;
  promptIntent: string;
};

export const videoFormats: VideoFormat[] = [
  {
    id: "ugc_virtual_try_on",
    name: "UGC Virtual Try On",
    shortDescription: "Try before you buy",
    promptIntent:
      "A creator visually tries on or demonstrates how the product looks when worn, styled, or used."
  },
  {
    id: "ugc_beauty_product",
    name: "UGC",
    shortDescription: "Realistic social media videos for beauty and product use",
    promptIntent:
      "A realistic creator-led social video where a person applies, uses, or reacts to the product."
  },
  {
    id: "tutorial",
    name: "Tutorial",
    shortDescription: "Step-by-step tutorials",
    promptIntent:
      "A short step-by-step demonstration showing how to use the product or achieve a result."
  },
  {
    id: "unboxing",
    name: "Unboxing",
    shortDescription: "High-quality unboxing",
    promptIntent:
      "Hands open packaging, reveal the product, inspect details, and create a first-impression moment."
  },
  {
    id: "product_only",
    name: "Product Only",
    shortDescription: "Product-only B-roll without a visible creator",
    promptIntent:
      "A product-only commercial B-roll clip with close-ups, texture shots, product movement, and no visible creator."
  },
  {
    id: "app_ugc",
    name: "App UGC",
    shortDescription: "Creator-led app or web service review",
    promptIntent:
      "A realistic creator-led UGC video for an app or web service, showing the app on a laptop or phone while the creator reacts, points, or explains the core benefit."
  },
  {
    id: "app_split_demo",
    name: "App Split Demo",
    shortDescription: "Creator plus app or web demo split-screen",
    promptIntent:
      "A split-screen short where a creator reaction or hook appears alongside an app interface, web dashboard, software workflow, chart, or product demo."
  },
  {
    id: "before_after",
    name: "Before & After",
    shortDescription: "Before and after comparison",
    promptIntent:
      "A clear transformation or comparison video showing the state before use and the improved state after use."
  }
];

export function getVideoFormat(id: string): VideoFormat {
  return videoFormats.find((format) => format.id === id) ?? videoFormats[0];
}
