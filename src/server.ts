import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listStyles, loadPipeline } from './pipeline.js';
import { verifyPage } from './verify.js';

export const VERSION = '0.1.0';

const viewportSchema = z.object({
  name: z.string().optional().describe('Label, e.g. "mobile"'),
  width: z.number().int().min(200).max(4000),
  height: z.number().int().min(200).max(4000),
  isMobile: z.boolean().optional(),
  hasTouch: z.boolean().optional(),
  deviceScaleFactor: z.number().min(1).max(4).optional(),
});

const text = (t: string) => ({ type: 'text' as const, text: t });

export function createServer(): McpServer {
  const server = new McpServer({ name: 'frontend-stack', version: VERSION });

  server.registerTool(
    'frontend_stack_pipeline',
    {
      title: 'Frontend stack pipeline',
      description:
        'Returns the frontend build pipeline (audit, one style, taste floor, build, review, verify, perf) and the style menu as markdown. Call it at the start of any website, landing page, UI, or redesign build.',
    },
    async () => ({ content: [text(loadPipeline())] }),
  );

  server.registerTool(
    'list_styles',
    {
      title: 'List style directions',
      description: 'Returns the style menu as JSON grouped by family. Pick exactly ONE style per build.',
    },
    async () => ({ content: [text(JSON.stringify(listStyles(), null, 2))] }),
  );

  server.registerTool(
    'verify_page',
    {
      title: 'Verify page',
      description:
        'Opens a URL in Playwright Chromium at each viewport (default: 390x844 mobile touch and 1440x900 desktop) and returns a screenshot, console errors, failed requests (4xx/5xx), horizontal overflow, axe-core accessibility violations, an ARIA accessibility snapshot, and the detected pointer type (coarse/fine). Look at the screenshots before calling a build done.',
      inputSchema: {
        url: z.string().url().describe('Page to check, e.g. http://localhost:5173'),
        viewports: z
          .array(viewportSchema)
          .min(1)
          .max(6)
          .optional()
          .describe('Defaults to mobile 390x844 (isMobile + hasTouch) and desktop 1440x900'),
        fullPage: z.boolean().optional().describe('Full-page screenshot (default false)'),
        waitFor: z.string().optional().describe('CSS selector to wait for before checking'),
        channel: z.string().optional().describe('Browser channel, e.g. "chrome" or "msedge"'),
        snapshot: z.boolean().optional().describe('Include the ARIA accessibility snapshot of the page (default true)'),
      },
    },
    async (args) => {
      try {
        const reports = await verifyPage(args);
        const content = reports.flatMap(({ screenshot, ...report }) => [
          text(JSON.stringify(report, null, 2)),
          { type: 'image' as const, data: screenshot, mimeType: 'image/jpeg' },
        ]);
        return { content };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const hint = /Executable doesn't exist|playwright install/i.test(message)
          ? '\nHint: run `npx playwright install chromium`, or pass channel "chrome" to use an installed Chrome.'
          : '';
        return { content: [text(`verify_page failed: ${message}${hint}`)], isError: true };
      }
    },
  );

  server.registerPrompt(
    'frontend_stack',
    { title: 'Frontend stack', description: 'Run the full frontend pipeline on the current build.' },
    () => ({
      messages: [
        {
          role: 'user' as const,
          content: text(`Follow this pipeline for the current frontend task.\n\n${loadPipeline()}`),
        },
      ],
    }),
  );

  server.registerResource(
    'pipeline',
    'frontend-stack://pipeline',
    { title: 'Frontend stack pipeline', description: 'Pipeline and style menu', mimeType: 'text/markdown' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: loadPipeline() }] }),
  );

  return server;
}
