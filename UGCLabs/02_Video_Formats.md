# Video Formats

The UI keeps video format as a simple intent selector. It does not choose a separate audio pipeline or render pipeline.

All launch formats use fal Kling native audio through `generate_audio=true`.

Current formats:

- Product Review
- UGC Virtual Try On
- UGC
- Tutorial
- Unboxing
- Product Only
- App UGC
- App Split Demo
- Before & After

Prompt behavior:

- The selected format gives the intent resolver broad rules.
- Gemini reference analysis supplies the actual shot flow.
- Product analysis supplies product-specific usage and proof moments.
- GPT composes the final `generationPrompt`.

Format examples:

- Product Review: creator-led product presentation and proof.
- UGC Virtual Try On: worn, styled, fitted, applied, or visually tested product.
- Tutorial: ordered steps and result.
- Unboxing: package, reveal, first touch, close detail, final view.
- Product Only: no visible face unless future UI explicitly allows it.
- App formats: screen/interface/workflow is the product proof.
