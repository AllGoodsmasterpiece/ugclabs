# UGCLabs Codex Handoff

Last updated: 2026-05-14

## Current Standard

The launch MVP pipeline is now fixed to fal Kling v3 Pro Image-to-Video.

Reference videos are used for analysis only. They are never sent directly to the generation model.

## Pipeline

1. User selects:
   - Product Source Mode: `Same product` or `Replace product`
   - Video format
   - Product name
   - Reference video
   - Product image
   - Creator / Model mode
   - Length and variant count

2. Reference Video Analysis = Gemini
   - Extract cut order, camera framing, product exposure timing, hand gestures, tone/tempo, and hook structure.
   - Do not use the reference person as the target identity.
   - In `Replace product`, do not carry over source product appearance, brand, features, or usage.
   - In `Same product`, preserve matching handling/demo flow, but uploaded product image still wins visually.

3. Product Analysis = OpenAI
   - Identify product type, real use environment, usage method, benefits/functions to show, visual details to preserve, and the first-second visual priority.

4. Avatar Analysis = OpenAI
   - When model image exists, preserve face, hair identity, age range, styling, and overall appearance.
   - Wardrobe is normally preserved, with only light product-context adaptation.
   - Gestures are decided by the reference video and product use, not by avatar analysis.

5. Product Selling Plan = GPT
   - Decide what benefit to say, what function to show, what use scene to include, what proof shot is required, and how to end.
   - MVP default is automatic. User-provided benefits, banned phrases, and CTA can be added later as advanced fields.

6. Prompt Composer = GPT
   - Writes one `generationPrompt` per variant.
   - Required visible sections:
     - Asset Lock
     - Wardrobe and Hair
     - Background
     - Motion Shot Plan
     - Native Voice
   - Dialogue is generated automatically inside the prompt.

7. Asset Compile / Generation = fal Kling
   - Model image provided:
     - `@Element1 = uploaded model image`
     - `@Element2 = uploaded product image`
   - No model image:
     - `@Element1 = uploaded product image`
     - creator is generated from prompt and may vary.
   - `generate_audio=true`
   - Result MP4 is cached locally under `public/outputs` for browser playback.

## Model Source Modes

- `Auto creator`
  - No model image.
  - Fastest and lowest friction.
  - Creator identity may vary.

- `One model for all videos`
  - One uploaded model image.
  - Stable creator across all generated variants.

- `Model per account`
  - One uploaded model image per account.
  - Each variant/account locks to its own creator image.

## Product Source Modes

- `Same product`
  - The reference video product and uploaded product are intended to be the same product.
  - Preserve matching product handling, product exposure timing, and demo flow.
  - Uploaded product image is still the visual source of truth.

- `Replace product`
  - The reference video is only a structure/motion/style reference.
  - Replace source product details with the uploaded product analysis and product image.

## Runtime Files

- `app/page.tsx`
  - UI for product mode, uploads, model source, format, length, and variants.
  - No 480p/720p mode switch.
  - No Hook/Setting/Reference preset UI.

- `app/api/product-focus/generate/route.ts`
  - Single generation route.
  - Saves uploads.
  - Runs asset profiles, Gemini reference analysis, intent resolver, GPT composer, and fal Kling generation.
  - No Atlas/Seedance fallback.
  - No Creatomate.
  - No ElevenLabs.

- `lib/gemini.ts`
  - Reference video analysis only.

- `lib/asset-builder.ts`
  - Product and avatar analysis.
  - Product visual lock / preservation details.

- `lib/intent-resolver.ts`
  - Simple Same/Replace product handling and video-format rules.

- `lib/planner.ts`
  - OpenAI-only Product Selling Plan + Prompt Composer.
  - Outputs `generationPrompt`.

- `lib/fal-kling.ts`
  - fal Kling v3 Pro Image-to-Video client.
  - Compiles internal tokens to `@Element1` / `@Element2`.
  - Strips unsupported video references before sending to fal.

- `lib/types.ts`
  - Current API response fields use `generationPrompt`, `sourceUrl`, and `native_audio`.

## Deleted / Retired Paths

These are no longer part of the runtime:

- Seedance / Atlas generation client
- Atlas Kling reference-to-video experiment branch
- Creatomate render path
- ElevenLabs voiceover path
- Hook format library
- Setting format library
- Reference preset recipe loader
- `seedancePrompt`, `seedanceUrl`, `seedance_native`, `elevenlabs_vo`, and 480p/720p UI concepts

## Cost Rule

Do not run paid fal Kling generation unless the user explicitly asks to generate/test.

Normal verification should use build/type checks and local UI inspection only.

## Latest Session Exit Note

Date: 2026-05-15

The current direction is to mimic Higgsfield-style inline asset binding, not section-based prompt output.

Desired prompt style:

```text
A young stylish female creator @avatar:target_creator is in a cozy modern apartment with soft natural daylight. She records selfie-style, holding the AURA tumbler @product:target_product close to camera. She rotates it, shows the handle and lid, taps it, and takes a sip. Dialogue: "..."
```

Important decisions from the latest debugging:

- Do not put `@Element1` / `@Element2` in a large system-like first sentence.
- Do not output `@video:reference_motion` in user-visible `generationPrompt`.
- Use avatar/model reference for face identity only.
- Do not copy the avatar image's background, outfit, pose, or static photo composition.
- Use the reference video analysis for background, wardrobe style, pose/action, framing, pacing, and product exposure timing.
- Product must still be locked through the product element.

Current code state:

- `lib/planner.ts` was changed so GPT should output compact Higgsfield-style paragraph prompts with inline `@avatar:target_creator` and `@product:target_product`.
- `lib/fal-kling.ts` compiles those tokens to `@Element1` / `@Element2` before fal submission.
- `lib/fal-kling.ts` was changed to remove strong `@Element1 exact creator/model` style prefix and instead says the uploaded creator element is identity-only.
- `lib/fal-kling.ts` still currently uses product image as `start_image_url`, which caused product-only floating start frames.

Critical unfinished change:

- `lib/scene-starter.ts` was added but not wired yet.
- It extracts a first frame from the uploaded reference video with ffmpeg.
- Next session should wire it into `app/api/product-focus/generate/route.ts` and `lib/fal-kling.ts` so:
  - `start_image_url = extracted reference-video starter frame`
  - `elements[0] = model image when provided`
  - `elements[1] = product image when model exists`
  - prompt keeps inline avatar/product binding
- This should reduce both failure modes:
  - model-photo background/outfit/pose contamination
  - product-only floating first frame

Recommended next implementation:

1. Update `FalKlingAssetFiles` to accept `starterImagePath?: string` and `starterImageMimeType?: string`.
2. In `buildFalImageReferences`, upload `starterImagePath` if present and use it as `startImageUrl`.
3. In the API route, after saving `referenceVideoPath`, call `createReferenceStarterFrame(referenceVideoPath, jobId, warnings)`.
4. Pass the returned starter frame path into `generateFalKlingVideo`.
5. In planner hard rules, fully ban `@video:reference_motion` from `generationPrompt`; reference video should only influence text content.
6. Build check.
7. Do not run paid generation unless explicitly requested.
