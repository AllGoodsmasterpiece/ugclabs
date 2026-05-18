# Account and Product Assets

This document captures the asset system required after the first generation MVP.

The core idea:

> UGCLabs should not only generate videos. It should manage the account persona, fixed creator/model assets, and product assets that make generated videos consistent across many uploads.

## Posting Modes

UGCLabs needs two posting modes.

| Mode | Use case | Asset requirement |
|---|---|---|
| Single Account | One account uploads many videos | Consistency is useful but not mandatory |
| Multi Account | Many TikTok/Instagram accounts upload many videos | Each account needs a fixed creator/model asset |

## Account Profile

For multi-account operators, each social account should have a saved profile.

Account profile fields:

| Field | Purpose |
|---|---|
| Social handle | TikTok/Instagram account ID or nickname |
| Platform | TikTok, Instagram, YouTube Shorts, etc. |
| Creator persona | The character style for this account |
| Fixed model asset | The recurring AI creator/model used by this account |
| Voice style | Preferred voice, tone, accent, and energy |
| Preferred formats | Formats that fit this account |
| Preferred settings | Bathroom, bedroom, office, street, etc. |
| Product categories | Beauty, app, fitness, fashion, gadgets, etc. |
| Avoid rules | Things this account should not show or say |

Why this matters:

- Multi-account users need account-level consistency.
- A viewer should feel that each account is run by one repeatable creator/persona.
- Random model changes reduce believability and can weaken account identity.

## Model Asset

A model asset is the fixed visual identity for an account.

Model asset examples:

```text
Account: @glowdaily_jane
Model asset:
- 23-year-old female beauty creator
- black hair, warm skin tone
- bathroom and bedroom UGC settings
- soft enthusiastic tone
- no luxury studio look
```

Possible model asset inputs:

- Reference images
- Reference videos
- Face/body style descriptions
- Outfit references
- Creator personality notes
- Voice reference or selected TTS voice

MVP note:

- Do not build full model asset training yet.
- Start by storing persona text, reference images, and preferred generation rules.
- Later, connect this to models that support character/reference consistency.

## Product Asset

Product assets should be stored separately from account profiles.

Product asset fields:

| Field | Purpose |
|---|---|
| Product name | Display and prompt identity |
| Product URL | Optional source page |
| Product category | Beauty, app, fashion, fitness, etc. |
| Product photos | Main product, label, packaging, texture |
| Use-case photos | Product in hand, product applied, app screen, result screenshot |
| Benefits | Claims the user wants to communicate |
| Forbidden claims | Claims that should not be generated |
| Brand style | Visual or tone constraints |

## Product Upload Modes

UGCLabs should support two product modes.

| Mode | Use case |
|---|---|
| One Product to Many Videos | Upload one product asset and generate 10-30 variants |
| Many Products to Many Videos | Upload multiple products and generate video packs per product |

Examples:

```text
One product:
Medicube serum -> 30 creative variants
```

```text
Many products:
Serum A -> 10 variants
Cream B -> 10 variants
Mask C -> 10 variants
```

## Future Data Structure

```text
Workspace
  Campaign
    Account Profiles
      @account_1
        Model Asset A
      @account_2
        Model Asset B
      @account_3
        Model Asset C
    Product Assets
      Product A
      Product B
    Generation Jobs
      Format
      Hook
      Setting
      Account Profile
      Model Asset
      Product Asset
      Output Videos
```

## Product Implication

The future product should feel like:

```text
Choose account profile
Choose product asset
Choose format/hook/setting strategy
Generate creative pack
```

This is more defensible than a simple prompt-to-video tool because UGCLabs stores and reuses the user's account and product context.
