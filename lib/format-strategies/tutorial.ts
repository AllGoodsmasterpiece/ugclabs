import type { FormatStrategy } from "./types";

export const tutorialStrategy: FormatStrategy = {
  id: "tutorial",
  directorName: "Tutorial Step Director",
  layerPurpose:
    "Convert reference motion into a clear ordered product-use sequence: setup, first action, operation, proof, result, and CTA.",
  priority: [
    "Product Analysis physicalUseModel naturalUseSequence",
    "product real use method",
    "step sequence clarity",
    "visible hands/product interaction",
    "product detail preservation",
    "creator identity when provided",
    "reference camera, pacing, and rhythm",
    "source reference product pose only when compatible"
  ],
  starterPolicy: "creator_product_scene",
  renderer: "fal_kling",
  eligibilityRules: [
    "Use when the product has a visible operation, application, setup, workflow, or repeatable use step.",
    "If the product has no obvious user action, convert tutorial into a short demonstration of placement, detail inspection, comparison, and result.",
    "Use Product Analysis physicalUseModel to decide the access point, required preconditions, valid interaction points, and failure modes to avoid."
  ],
  requiredBeats: [
    "show product in the first second",
    "show setup or starting state with the correct access point visible",
    "show one concrete first action using a valid interaction point",
    "show one operation/application/use step in the correct order",
    "show close-up proof of the product detail or use result",
    "end with a clear result, benefit, or CTA"
  ],
  plannerRules: [
    "Every motionChoreography beat must become a product-use step, not generic posing or face-only talking.",
    "Use physicalUseModel.naturalUseSequence as the source of truth for step order.",
    "Use physicalUseModel.activationOrAccessPoint and validInteractionPoints for the first hand/product action.",
    "Avoid every physicalUseModel.failureModesToAvoid.",
    "Numbered wording is allowed in the script, but the generationPrompt should stay natural and cinematic.",
    "Compress steps to fit the selected duration without skipping the visible result.",
    "For 5 seconds, use three beats: setup, action/proof, result.",
    "For 10-15 seconds, use four to five beats: setup, step 1, step 2/proof, result, CTA."
  ],
  dialogueRules: [
    "Dialogue must explain what is happening in the current step.",
    "Use category-correct action verbs from Product use rules.",
    "Use short instructional phrasing such as 'first', 'then', 'now', or 'watch this' only when natural.",
    "Avoid vague lines like 'this is so good' unless paired with a visible proof."
  ],
  safetyRules: [
    "Do not promise medical, financial, or guaranteed outcomes.",
    "Only describe results that can be visually shown in the generated clip.",
    "Do not invent hidden ingredients, app functions, included accessories, certifications, measurements, or results."
  ],
  avoidRules: [
    "do not make the steps vague or out of order",
    "do not hide the product while explaining the step",
    "do not turn the tutorial into a face-only testimonial",
    "do not skip the setup/action and jump straight to a beauty shot",
    "do not perform actions on invalid product parts"
  ],
  promptFrame:
    "Create a reference-matched step-by-step tutorial where the uploaded product remains visible, the first action uses the correct access point, and each beat shows setup, operation, proof, or result in order."
};
