# UGC Subtypes

UGC is not one format. It is a family of repeatable creative patterns.

This document defines the full UGC subtype library and the smaller MVP-active set.

## Full UGC Subtype Library

UGC should be separated from adjacent formats with this rule:

| Nearby format | Difference from UGC |
|---|---|
| Product Review | Product Review centers on functional proof, specs, benefits, and evaluation. UGC centers on the creator's natural reaction and lifestyle context. |
| Tutorial | Tutorial centers on teaching steps in order. UGC can include usage, but it does not need to teach a repeatable process. |
| Unboxing | Unboxing centers on opening and revealing packaging. UGC can include a reveal, but the creator's reaction or life context remains the main reason to watch. |

| ID | Name | Description | Best fit |
|---|---|---|---|
| `performance_use_proof` | Performance / Use Proof | Proves how the product feels or performs during real use | Sports gear, tools, fitness, gadgets |
| `try_on_detail_reaction` | Try-On Detail Reaction | Shows how the product looks when worn, then reacts to details | Fashion, shoes, accessories, beauty |
| `satisfying_detail_asmr` | Satisfying Detail / ASMR | Repeats visually satisfying details such as glitter, liquid, texture, motion, or small parts | Accessories, beauty, novelty products |
| `real_result_proof` | Real Result Proof | Shows a tangible result after actual use | Beauty, art tools, apps, productivity, fitness |
| `sensory_unboxing` | Sensory Unboxing | Focuses on packaging, texture, sound, tactile reveal, and premium feel | Fashion, bags, beauty, luxury, gifts |
| `lifestyle_daily_review` | Lifestyle Daily Review | Natural daily-use testimonial that makes the product feel integrated into life | Home, drinkware, apps, wellness, beauty |
| `problem_solution` | Problem Solution | Opens with a common frustration, then shows the product solving it | Apps, beauty, home, health, tools |
| `routine_integration` | Routine Integration | Inserts the product into a morning, night, gym, work, or commute routine | Beauty, supplements, apps, drinkware |
| `comparison_review` | Comparison Review | Compares an old option against the new product | Beauty, appliances, apps, food, tools |
| `failed_attempts_discovery` | Failed Attempts Discovery | Frames the product as the discovery after several failed attempts | Skincare, diet, apps, tools, wellness |
| `friend_recommendation` | Friend Recommendation | Feels like a direct recommendation to a friend | Most categories |
| `grwm_integration` | GRWM Integration | Uses the product inside a Get Ready With Me flow | Beauty, fashion, accessories |
| `one_day_test` | One Day Test | Uses the product for one day and reports the experience | Apps, home products, beauty, food |
| `everyday_carry_essentials` | Everyday Carry / Essentials | Shows the product as part of a bag, desk, car, or daily essentials setup | Small products, apps, lifestyle goods |
| `comment_reply` | Comment Reply | Starts as a response to a viewer comment or repeated question | Products with FAQs or objections |
| `myth_busting` | Myth Busting | Corrects a common misconception about the product or category | Functional products, apps, beauty |
| `buyer_checklist` | Buyer Checklist | Lists what to check before buying this type of product | Higher-consideration products, apps, electronics |

## MVP Active UGC Subtypes

Use only these eight subtypes in the first UGC productization pass:

| ID | Name | Reason |
|---|---|---|
| `performance_use_proof` | Performance / Use Proof | Clear product validation pattern |
| `try_on_detail_reaction` | Try-On Detail Reaction | Strong for fashion, accessories, shoes, beauty |
| `satisfying_detail_asmr` | Satisfying Detail / ASMR | High retention for visual-detail products |
| `sensory_unboxing` | Sensory Unboxing | Strong for physical products and packaging |
| `lifestyle_daily_review` | Lifestyle Daily Review | Broadly usable across categories |
| `problem_solution` | Problem Solution | Reliable direct-response structure |
| `routine_integration` | Routine Integration | Natural UGC pattern with repeatable scenes |
| `comparison_review` | Comparison Review | Good for demonstrating differentiation |

## Prompt Design Implication

Each UGC subtype needs:

- Product proof shots.
- First 3-second timeline.
- Camera and framing rules.
- Creator behavior rules.
- Dialogue style.
- Required product actions.
- Avoid rules.

Example:

```text
UGC subtype: Satisfying Detail / ASMR
Product proof: glitter movement, liquid flow, texture, tiny objects shifting
Timeline:
0.0-0.5s close-up detail movement
0.5-2.0s repeat motion from another angle
2.0-3.0s creator reaction or short line
Avoid: generic face-only intro
```

## Asset Library Implication

When collecting references, tag each video with:

```text
video_format
ugc_subtype
hook_format
setting
product_category
product_action
```

This lets UGCLabs generate more stable prompts from a reference library instead of relying only on free-form prompting.
