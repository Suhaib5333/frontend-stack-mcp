---
name: frontend-stack
description: The full frontend skill stack. Load whenever the user says "use all frontend skills", "full frontend stack", "all design skills", "frontend stack", "use all my design skills", or starts any website, landing page, UI, app frontend, or redesign build. Routes to every installed design, quality, and verification skill in the right order and picks one style direction.
---

# Frontend Stack

The trigger means: run the whole pipeline below, not one skill.

## Rule 0: styles are exclusive, process is cumulative

Process and quality skills stack. **Style skills do not.** Never mix two style skills:
`brutalism` + `minimal` + `neon` = slop. Pick exactly ONE and say which.

## The pipeline

| # | Phase | Skill(s) | When |
|---|---|---|---|
| 1 | Audit | `redesign-existing-projects` | existing UI only. Skip on greenfield. |
| 2 | Direction | **ONE** style skill (see menu) | always. State the pick and why in one line. |
| 3 | Taste floor | `design-taste-frontend`, `high-end-visual-design` | always. Anti-templated defaults. |
| 4 | Visual ref | `imagegen-frontend-web` (web) / `imagegen-frontend-mobile` (app), then `image-to-code` | when the look matters more than the wiring. One image PER section. |
| 5 | Motion | `gpt-taste` | scroll-driven, GSAP, or animated pages. |
| 6 | Build | `full-output-enforcement` | always. No placeholders, no "// rest of code". |
| 7 | Review | `web-design-guidelines`, `frontend-design` | always, before declaring done. |
| 8 | Verify | `verify_page` tool from this server (390x844 mobile touch + 1440x900 desktop: screenshot, ARIA snapshot, console, network, overflow, axe), or Playwright MCP (`browser_navigate` → `browser_snapshot` → `browser_take_screenshot`, resize 390 + 1440) | always if it runs locally. Look at it. |
| 9 | Perf | `web-perf` | ship-ready, or the user mentions speed or Lighthouse. |
| 10 | Brand assets | `brandkit` | logo, identity, or brand board requested. |

Non-negotiables regardless of phase skipping: **2, 3, 6, 7**. Phase 8 whenever a URL exists.
Skills that are not installed are skipped and named as skipped in the routing table.

## Style menu (pick ONE)

**Clean/premium:** minimal · minimalist-ui · clean · sleek · refined · premium · power · professional · spacious · square · shadcn · geometric · flat · modern
**Editorial:** editorial · basic · paper · terracotta · impeccable · claude · riso · modern
**Loud:** brutalism · neobrutalism · industrial-brutalist-ui · bold · dramatic · pulse · expressive · artistic · vibrant · colorful
**Tech/dark:** cosmic · matrix · mono · futuristic · neon · enterprise · codex · glassmorphism · gradient
**Playful:** fiction · doodle · sketch · lingo · creative · friendly · cafe · claymorphism · vintage · retro · dithered · pacman · tetris · sega · fantasy
**Product/app:** ant · material · stitch · roku · corporate · contemporary · agentic · bento · levels
**Depth/story:** neumorphism · skeumorphism · perspective · immersive · storytelling

No style named by the user: infer it from the brief and state the pick. Do not ask.

## Output contract

Open with the routing table (phases used, style picked, phases skipped and why), then build.
Close with the screenshot, or the reason there isn't one.
