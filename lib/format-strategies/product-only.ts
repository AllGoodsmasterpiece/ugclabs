import type { FormatStrategy } from "./types";

export const productOnlyStrategy: FormatStrategy = {
  id: "product_only",
  directorName: "Product Display Director",
  layerPurpose:
    "Remove creator-led UGC behavior and convert reference style into product-only B-roll, macro proof, surface movement, and light/detail shots.",
  priority: [
    "exact product appearance",
    "product-only framing",
    "macro detail proof",
    "surface, lighting, and camera motion",
    "reference visual rhythm",
    "hands only when physically necessary"
  ],
  starterPolicy: "product_only_scene",
  renderer: "fal_kling",
  eligibilityRules: [
    "Use for products that can be displayed on a surface, worn by an unseen person, rotated, opened, poured, lit, or shown in macro detail.",
    "Do not use visible talking-head creator composition."
  ],
  requiredBeats: [
    "show the product alone in the first second",
    "show one hero product angle",
    "show one macro/detail proof angle",
    "show one use-context or movement shot",
    "end with a clean product hold or product resting frame"
  ],
  plannerRules: [
    "Do not include an avatar token even if a model image exists.",
    "Use hands only as anonymous interaction if required by product use.",
    "Replace selfie, face, or creator reaction reference beats with equivalent product camera moves."
  ],
  dialogueRules: [
    "Prefer no spoken creator dialogue; use short voiceover-style product copy only if native audio needs speech.",
    "Do not write mouth movement or creator speaking lines."
  ],
  safetyRules: [
    "No unsupported claims.",
    "Do not invent logos, text, product variants, accessories, or packaging."
  ],
  avoidRules: [
    "do not include a visible creator, face, selfie, or talking head",
    "do not use a chest-height holding pose",
    "do not hide the product behind hands"
  ],
  promptFrame:
    "Create a reference-matched product-only B-roll clip with no visible creator, using the reference camera feel while keeping the uploaded product as the only hero."
};
