# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Reporting a vulnerability

Please do not open a public issue. Use [private vulnerability reporting](https://github.com/Suhaib5333/frontend-stack-mcp/security/advisories/new). You should get a reply within 7 days.

## Things to know

- `verify_page` opens whatever URL the model passes, in a real browser. Run the server only with clients you trust, and prefer local or staging URLs.
- `FRONTEND_STACK_USER_DATA_DIR` gives the browser your logged-in sessions. Use a dedicated profile, never your everyday one, and never on shared machines.
- Screenshots and page text are returned to the MCP client (and so to the model). Do not verify pages that show secrets.
