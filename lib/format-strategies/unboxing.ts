import type { FormatStrategy } from "./types";

export const unboxingStrategy: FormatStrategy = {
  id: "unboxing",
  directorName: "Reveal Director",
  layerPurpose:
    "Transform reference motion into a package, opening, reveal, first-touch, detail, and reaction sequence.",
  priority: [
    "reveal sequence",
    "product and packaging visibility",
    "first-touch interaction",
    "product detail preservation",
    "creator reaction when provided",
    "reference pacing and camera movement"
  ],
  starterPolicy: "creator_product_scene",
  renderer: "fal_kling",
  eligibilityRules: [
    "Best when packaging, box, pouch, seal, wrapper, or reveal action is visible or reasonable for the product.",
    "If packaging is not provided, downgrade to product reveal or first-impression instead of inventing branded packaging."
  ],
  requiredBeats: [
    "show package or covered product in the first second",
    "show opening, sliding, peeling, lifting, or reveal action",
    "show the uploaded product clearly after reveal",
    "show a close detail/proof shot",
    "show a natural reaction or final product display"
  ],
  plannerRules: [
    "Reference hand motion should become opening/reveal motion when compatible.",
    "If no package exists in the product image, avoid claiming a real branded box exists.",
    "The uploaded product must be the revealed item, not the source reference product."
  ],
  dialogueRules: [
    "Dialogue should sound like a first impression or reveal.",
    "Mention a visible detail after the reveal.",
    "Do not describe packaging details that are not provided."
  ],
  safetyRules: [
    "Do not invent official branding, seals, certifications, or included accessories.",
    "Avoid fake purchase, delivery, or authenticity claims."
  ],
  avoidRules: [
    "do not skip the opening or reveal action",
    "do not reveal a different product",
    "do not invent packaging graphics not shown by the uploaded asset"
  ],
  promptFrame:
    "Create a reference-matched unboxing or reveal video where the motion builds toward opening, revealing, inspecting, and reacting to the uploaded product."
};
