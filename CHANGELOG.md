# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-02

### Added

- `frontend_stack_pipeline` tool, `frontend_stack` prompt and `frontend-stack://pipeline` resource with the 10-phase pipeline and style menu.
- `list_styles` tool returning the style menu as JSON.
- `verify_page` tool: Playwright Chromium at 390x844 mobile (touch) and 1440x900 desktop by default, returning a screenshot, ARIA snapshot, console errors, failed requests, horizontal overflow with offending elements, axe-core violations and pointer type.
- Optional `channel` and `FRONTEND_STACK_USER_DATA_DIR` for an installed browser or a logged-in profile.
- Claude Code plugin and marketplace packaging with the `frontend-stack` skill.

[Unreleased]: https://github.com/Suhaib5333/frontend-stack-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Suhaib5333/frontend-stack-mcp/releases/tag/v0.1.0
