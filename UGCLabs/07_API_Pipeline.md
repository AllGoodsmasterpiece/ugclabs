# API Pipeline

Endpoint:

- `POST /api/product-focus/generate`

Input:

- `referenceVideo`
- `productImage`
- `productName`
- `videoFormat`
- `referenceProductMode`
- `modelMode`
- `sharedCreatorImage` or per-account creator images when selected
- `duration`
- `count`

Server flow:

1. Validate files and model mode.
2. Save uploads locally.
3. Build reference video, product, and avatar asset profiles.
4. Run Gemini reference analysis.
5. Resolve intent from product mode, video format, and product analysis.
6. Use GPT to create Product Selling Plan and `generationPrompt`.
7. Compile internal tokens into fal Kling element references.
8. Submit fal Kling v3 Pro Image-to-Video with `generate_audio=true`.
9. Cache returned MP4 locally.
10. Return analysis, asset profiles, prompt, source URL, playback URL, and warnings.

Output field names:

- `generationPrompt`
- `sourceUrl`
- `playbackUrl`
- `audioMode: native_audio`
