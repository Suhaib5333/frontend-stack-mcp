# frontend-stack-mcp

[![CI](https://github.com/Suhaib5333/frontend-stack-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Suhaib5333/frontend-stack-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)
[![MCP](https://img.shields.io/badge/MCP-server-8A2BE2.svg)](https://modelcontextprotocol.io)

An MCP server and Claude Code plugin that gives your AI coding agent two things:

1. **A frontend build pipeline.** Ten phases (audit, one style direction, taste floor, visual reference, motion, build, review, verify, perf, brand) plus a style menu, with one hard rule: styles are exclusive, process is cumulative.
2. **`verify_page`.** Opens your page in a real Playwright browser at phone and desktop size and hands back what a reviewer would check: a screenshot, an accessibility snapshot, console errors, failed requests, horizontal overflow (and which elements cause it), axe-core violations, and whether the page saw a touch (coarse) or mouse (fine) pointer.

The agent stops saying "done" on a page it never looked at.

## 60-second quickstart (Claude Code)

```bash
claude mcp add frontend-stack -- npx -y github:Suhaib5333/frontend-stack-mcp
npx playwright install chromium   # once per machine
```

Then ask: *"Run verify_page on http://localhost:5173 and fix what it finds."*

Or install it as a **plugin** (MCP server and the `frontend-stack` skill together):

```text
/plugin marketplace add Suhaib5333/frontend-stack-mcp
/plugin install frontend-stack@frontend-stack-mcp
```

## Other clients

The first `npx` run downloads and builds the server from GitHub, so it can take a minute. Later runs use the npm cache.

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "frontend-stack": {
      "command": "npx",
      "args": ["-y", "github:Suhaib5333/frontend-stack-mcp"]
    }
  }
}
```

**Cursor** (`.cursor/mcp.json` or `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "frontend-stack": {
      "command": "npx",
      "args": ["-y", "github:Suhaib5333/frontend-stack-mcp"]
    }
  }
}
```

**VS Code** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "frontend-stack": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:Suhaib5333/frontend-stack-mcp"]
    }
  }
}
```

**From a clone:** `npm ci && npm run build`, then point your client at `node /path/to/frontend-stack-mcp/dist/index.js`.

## Tools, prompt and resource

| Name | Kind | What it does |
|---|---|---|
| `frontend_stack_pipeline` | tool | Returns the pipeline and style menu as markdown. Call at the start of a build. |
| `list_styles` | tool | Style menu as JSON, grouped by family. Pick exactly one. |
| `verify_page` | tool | Playwright check of a URL at each viewport. See below. |
| `frontend_stack` | prompt | The pipeline as a ready-made prompt. |
| `frontend-stack://pipeline` | resource | The pipeline markdown. |

### `verify_page` input

| Field | Type | Default | Notes |
|---|---|---|---|
| `url` | string | required | Any URL the browser can reach, e.g. `http://localhost:3000`. |
| `viewports` | array | 390x844 mobile (`isMobile`, `hasTouch`, 2x) and 1440x900 desktop | Each: `width`, `height`, optional `name`, `isMobile`, `hasTouch`, `deviceScaleFactor`. Max 6. |
| `fullPage` | boolean | `false` | Full-page screenshot instead of the first screen. |
| `waitFor` | string | none | CSS selector to wait for before checking (for client-rendered apps). |
| `channel` | string | none | Use an installed browser: `chrome`, `msedge`. |
| `snapshot` | boolean | `true` | Include the ARIA accessibility snapshot (YAML, truncated at 6000 characters). |

### `verify_page` output (per viewport)

A JSON text block followed by a JPEG screenshot:

```json
{
  "viewport": "mobile 390x844 touch",
  "pointer": "coarse",
  "consoleErrors": ["fixture console error"],
  "failedRequests": ["404 GET http://127.0.0.1:5173/missing.json"],
  "overflow": { "scrollWidth": 2008, "clientWidth": 390, "overflowing": true, "offenders": ["div#too-wide"] },
  "a11y": { "violations": 1, "items": [{ "id": "image-alt", "impact": "critical", "help": "Images must have alternative text", "nodes": 1 }] },
  "snapshot": "- main:\n  - heading \"Fixture page with known problems\" [level=1]\n  ..."
}
```

Failures (bad URL, missing browser, timeout) come back as an `isError` result with a hint, never a crashed server.

### Environment variables

| Variable | Effect |
|---|---|
| `FRONTEND_STACK_CHANNEL` | Default browser channel when the call does not pass one. |
| `FRONTEND_STACK_USER_DATA_DIR` | Use a persistent browser profile, so pages behind a login stay signed in. Use a dedicated profile. |
| `FRONTEND_STACK_HEADLESS` | Set to `false` to watch the browser. |

## The pipeline in one table

| # | Phase | Always? |
|---|---|---|
| 1 | Audit (existing UI only) | when redesigning |
| 2 | Direction: ONE style skill | yes |
| 3 | Taste floor | yes |
| 4 | Visual reference images | when the look matters most |
| 5 | Motion | animated pages |
| 6 | Build with no placeholders | yes |
| 7 | Review against guidelines | yes |
| 8 | Verify (`verify_page`) | whenever a URL exists |
| 9 | Perf | ship-ready |
| 10 | Brand assets | when asked |

Full text: [`skills/frontend-stack/SKILL.md`](skills/frontend-stack/SKILL.md). Step-by-step guide: [`docs/TUTORIAL.md`](docs/TUTORIAL.md). How it is built: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## FAQ

**Do I need the style and process skills the pipeline names?** No. The pipeline and `verify_page` work on their own. The named skills make each phase stronger; install the ones you want from the credits below. Missing ones are skipped and named as skipped.

**Why one style only?** Mixing style systems (brutalism plus minimal plus neon) produces incoherent pages. Process skills (taste, review, verify) stack; style skills do not.

**Is it the same as the Playwright MCP?** No. Playwright MCP is a general remote control for a browser. `verify_page` is one call that runs a fixed checklist at two real device profiles and returns the findings. They work well together.

**Does `hasTouch` really change the page?** Yes. With `isMobile` and `hasTouch` the page sees `(pointer: coarse)`, touch events and the mobile viewport meta, which is why `pointer` is reported, so hover-only UI shows up.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Executable doesn't exist` | `npx playwright install chromium`, or pass `channel: "chrome"`. On Linux CI: `npx playwright install --with-deps chromium`. |
| First start is slow or times out in the client | The first `npx github:` run builds the package. Run `npx -y github:Suhaib5333/frontend-stack-mcp` once in a terminal (it waits on stdin, press Ctrl+C), then restart the client. |
| `ERR_CONNECTION_REFUSED` | Your dev server is not running, or it listens on another host. Try `127.0.0.1` instead of `localhost`. |
| Profile is locked | Close other browsers using `FRONTEND_STACK_USER_DATA_DIR`. A profile can only be open once. |
| Blank screenshot on a client-rendered app | Pass `waitFor` with a selector that appears once the app has rendered. |
| Server does not appear in Claude Code | `claude mcp list`, then `claude mcp get frontend-stack` for the error. |

## Credits

The pipeline routes to these skills. Their contents are **not** included here; install them from their sources.

| Skills | Source | License |
|---|---|---|
| Style skills in the menu (minimal, bento, editorial, brutalism, neon and the rest) | [typeui.sh](https://typeui.sh) | MIT |
| `design-taste-frontend`, `high-end-visual-design`, `gpt-taste`, `redesign-existing-projects`, `full-output-enforcement`, `minimalist-ui`, `industrial-brutalist-ui`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `image-to-code`, `brandkit` | [taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT |
| `web-design-guidelines` | Vercel, [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | see source |
| `frontend-design` | Anthropic, [Claude Code plugins](https://github.com/anthropics/claude-code) | see source |
| `web-perf` | community skill | see source |

Built on the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk), [Playwright](https://playwright.dev) and [axe-core](https://github.com/dequelabs/axe-core).

## License

[MIT](LICENSE)
