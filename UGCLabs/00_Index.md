# UGCLabs Index

Current source of truth:

- `99_Codex_Handoff.md`

Current launch direction:

- Reference video is analyzed by Gemini.
- Product image and optional model images are analyzed by OpenAI.
- GPT creates Product Selling Plan and `generationPrompt`.
- fal Kling v3 Pro Image-to-Video generates the final video with native audio.
- Reference video is not sent to the generation model.

Current product decisions:

- Product Source Mode:
  - Same product
  - Replace product
- Model Source:
  - Auto creator
  - One model for all videos
  - Model per account

Active runtime files:

- `app/page.tsx`
- `app/api/product-focus/generate/route.ts`
- `lib/gemini.ts`
- `lib/asset-builder.ts`
- `lib/intent-resolver.ts`
- `lib/planner.ts`
- `lib/fal-kling.ts`
- `lib/types.ts`

Retired runtime concepts:

- External render composition
- Separate voiceover provider
- Reference preset UI
- Hook format UI
- Setting format UI
- 480p/720p mode selector
