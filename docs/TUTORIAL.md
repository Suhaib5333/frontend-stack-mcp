# Tutorial

From nothing to an agent that builds a page, looks at it on a phone and a desktop, and fixes what it finds.

## 1. Install

You need Node 20 or newer.

```bash
claude mcp add frontend-stack -- npx -y github:Suhaib5333/frontend-stack-mcp
npx playwright install chromium
```

Check it is connected:

```bash
claude mcp list
```

You should see `frontend-stack` with a check mark. Other clients: see the README.

Prefer the plugin? In Claude Code:

```text
/plugin marketplace add Suhaib5333/frontend-stack-mcp
/plugin install frontend-stack@frontend-stack-mcp
```

The plugin also installs the `frontend-stack` skill, so saying "use all frontend skills" loads the pipeline automatically.

## 2. First verify run

Start any local site (for example `npm run dev` in a Vite app on port 5173), then ask your agent:

> Run verify_page on http://localhost:5173

You get two blocks back, one per viewport, each with a screenshot:

- `mobile 390x844 touch` with `pointer: "coarse"`
- `desktop 1440x900` with `pointer: "fine"`

Read them in this order:

1. **Screenshot.** Does it look right? Is anything cut off?
2. **`overflow.overflowing`.** `true` means the page scrolls sideways. `offenders` names the first elements wider than the screen.
3. **`consoleErrors`** and **`failedRequests`.** Anything here is a real bug.
4. **`a11y.items`.** axe-core rule ids such as `color-contrast` or `image-alt`, with how many elements fail.
5. **`snapshot`.** The page as a screen reader sees it: headings, buttons, links and their names.

Then: *"Fix everything verify_page found and run it again until it is clean."*

## 3. Using the pipeline on a real build

Ask:

> Use all frontend skills. Build a landing page for a neighbourhood bakery.

The agent calls `frontend_stack_pipeline` (or loads the skill) and opens with a routing table like:

| Phase | Used? | Why |
|---|---|---|
| 1 Audit | skipped | greenfield |
| 2 Direction | `cafe` | warm, local, food |
| 3 Taste floor | yes | always |
| 6 Build | yes | always |
| 7 Review | yes | always |
| 8 Verify | yes | dev server running |

Things to hold it to:

- **One style.** If it mixes two style skills, ask it to pick one. `list_styles` shows the menu.
- **No placeholders.** Phase 6 means complete code.
- **It must look.** The final message ends with a screenshot from `verify_page`, or says why there is none.

## 4. Mobile and touch testing

The default mobile viewport is a real mobile emulation, not just a narrow window: `isMobile` turns on the viewport meta tag, and `hasTouch` makes the page report `(pointer: coarse)` and receive touch events.

Use it to catch:

- **Hover-only UI.** Menus or tooltips that only open on `:hover` do not work on touch. If `pointer` is `coarse`, check those controls in the screenshot and the snapshot.
- **Tiny tap targets.** Look for buttons smaller than about 44 by 44 CSS pixels.
- **Sideways scroll.** The most common mobile bug. `overflow.offenders` points at the cause.

Test more devices by passing your own viewports:

```json
{
  "url": "http://localhost:5173",
  "viewports": [
    { "name": "small phone", "width": 360, "height": 740, "isMobile": true, "hasTouch": true, "deviceScaleFactor": 3 },
    { "name": "tablet", "width": 820, "height": 1180, "isMobile": true, "hasTouch": true, "deviceScaleFactor": 2 },
    { "name": "laptop", "width": 1280, "height": 800 }
  ],
  "fullPage": true
}
```

## 5. Pages behind a login

Point the server at a dedicated browser profile you have signed in with once:

```bash
claude mcp add frontend-stack -e FRONTEND_STACK_USER_DATA_DIR=/path/to/profile -- npx -y github:Suhaib5333/frontend-stack-mcp
```

Sign in once with `FRONTEND_STACK_HEADLESS=false` so you can see the window. Use a profile made for testing, not your everyday browser profile.
