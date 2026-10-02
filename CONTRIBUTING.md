# Contributing

Thanks for helping. Small, focused pull requests are easiest to review.

## Setup

```bash
git clone https://github.com/Suhaib5333/frontend-stack-mcp.git
cd frontend-stack-mcp
npm ci
npx playwright install chromium
```

## Checks (all must pass, CI runs the same)

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Guidelines

- Keep the server lean: a new tool needs a clear use that `verify_page` or the pipeline does not cover.
- Every tool change comes with a test. Browser behaviour is tested against the fixture in `tests/fixtures/`.
- Tool failures return `isError: true` results with a helpful message. They never crash the server.
- Do not copy third-party skill contents into `skills/`. Link to them in the README credits instead.
- Update `CHANGELOG.md` under `Unreleased`.

## Commit messages

Short imperative subject line (for example "Add waitFor timeout option"), with a body when the why is not obvious.

By contributing you agree your work is released under the MIT License and that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
