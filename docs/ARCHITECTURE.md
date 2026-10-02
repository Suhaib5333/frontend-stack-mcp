# Architecture

```text
src/index.ts      stdio entry point (the npm bin)
src/server.ts     McpServer: registers 3 tools, 1 prompt, 1 resource
src/pipeline.ts   reads skills/frontend-stack/SKILL.md, strips frontmatter, parses the style menu
src/verify.ts     Playwright + axe-core checks, one browser context per viewport
skills/           the Claude Code skill, also the single source for the pipeline text
.claude-plugin/   plugin.json + marketplace.json for /plugin marketplace add
.mcp.json         plugin MCP config (runs the server through npx from GitHub)
tests/            vitest: unit tests and a browser test against tests/fixtures/broken.html
```

## Decisions

- **One source of truth.** The pipeline text lives only in `skills/frontend-stack/SKILL.md`. The tool, prompt and resource all read it, so the skill and the server cannot drift.
- **A context per viewport.** `isMobile` and `hasTouch` are context options in Playwright, so each viewport gets a fresh context. A resize alone would not change `pointer` or touch events.
- **One browser, many contexts.** Without a profile, one Chromium launch serves all viewports. With `FRONTEND_STACK_USER_DATA_DIR`, each viewport opens the persistent profile in turn, because a profile can only be open once.
- **Findings, not dumps.** Each viewport returns a small JSON summary plus one JPEG (quality 80) to keep model context small. The ARIA snapshot is capped at 6000 characters.
- **Errors are results.** Every failure becomes an `isError` result with a hint, so the agent can recover instead of losing the server.
- **Tests use the real stack.** The browser test serves the fixture over `node:http` and calls `verify_page` through the SDK's `InMemoryTransport`, the same path a client uses.
