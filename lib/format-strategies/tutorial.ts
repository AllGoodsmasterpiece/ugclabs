import type { FormatStrategy } from "./types";

export const tutorialStrategy: FormatStrategy = {
  id: "tutorial",
  directorName: "Tutorial Step Director",
  layerPurpose:
    "Convert reference motion into a clear ordered product-use sequence: setup, operation, proof, result, and CTA.",
  priority: [
    "product real use method",
    "step sequence clarity",
    "product detail preservation",
    "creator identity when provided",
    "reference camera, pacing, and rhythm",
    "source reference product pose only when compatible"
  ],
  starterPolicy: "creator_product_scene",
  renderer: "fal_kling",
  eligibilityRules: [
    "Use when the product has a visible operation, application, setup, workflow, or repeatable use step.",
    "If the product has no obvious user action, convert tutorial into a short demonstration of details and result."
  ],
  requiredBeats: [
    "show product in the first second",
    "show setup or starting state",
    "show one concrete operation step",
    "show close-up proof of the product detail or use result",
    "end with a clear result, benefit, or CTA"
  ],
  plannerRules: [
    "Every motionChoreography beat must become a product-use step, not generic posing.",
    "Numbered wording is allowed in the script, but the generationPrompt should stay natural and cinematic.",
    "Compress steps to fit the selected duration without skipping the visible result."
  ],
  dialogueRules: [
    "Dialogue must explain what is happening in the current step.",
    "Use category-correct action verbs from Product use rules.",
    "Avoid vague lines like 'this is so good' unless paired with a visible proof."
  ],
  safetyRules: [
    "Do not promise medical, financial, or guaranteed outcomes.",
    "Only describe results that can be visually shown in the generated clip."
  ],
  avoidRules: [
    "do not make the steps vague or out of order",
    "do not hide the product while explaining the step",
    "do not turn the tutorial into a face-only testimonial"
  ],
  promptFrame:
    "Create a reference-matched step-by-step tutorial where the uploaded product remains visible and each beat shows setup, operation, proof, or result."
};
