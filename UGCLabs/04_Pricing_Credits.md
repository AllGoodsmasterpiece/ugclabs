# Pricing And Credits

Current MVP cost model must be recalculated around fal Kling v3 Pro Image-to-Video.

Do not reuse older cost tables from retired pipelines.

Current cost drivers:

- fal Kling generated seconds
- Number of variants
- Gemini reference video analysis
- OpenAI product/avatar analysis and prompt composition
- Storage/egress for uploaded assets and cached MP4s

Current UI estimate is intentionally rough:

```text
duration_seconds * variant_count * 0.10 USD
```

This is not final pricing. Before customer billing, replace it with measured fal invoice data from several test generations.

Pricing principles:

- Charge by generated variant count and duration.
- Same Product and Replace Product can share the same base price unless measured retry rates differ.
- Model per account may cost more only if it increases variants or asset processing volume.
- Do not expose provider-specific quality controls until they are stable and meaningful.
