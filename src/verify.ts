import { AxeBuilder } from '@axe-core/playwright';
import { chromium, type Browser, type BrowserContext, type BrowserContextOptions } from 'playwright';

export interface Viewport {
  name?: string;
  width: number;
  height: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  deviceScaleFactor?: number;
}

export interface VerifyOptions {
  url: string;
  viewports?: Viewport[];
  fullPage?: boolean;
  waitFor?: string;
  channel?: string;
  /** Include the accessibility (ARIA) snapshot of the page. Default true. */
  snapshot?: boolean;
  timeoutMs?: number;
}

export type Pointer = 'coarse' | 'fine' | 'none';

export interface ViewportReport {
  viewport: string;
  pointer: Pointer;
  consoleErrors: string[];
  failedRequests: string[];
  overflow: { scrollWidth: number; clientWidth: number; overflowing: boolean; offenders: string[] };
  a11y: { violations: number; items: { id: string; impact: string; help: string; nodes: number }[] };
  /** ARIA snapshot (YAML) of the page, truncated to SNAPSHOT_LIMIT characters. */
  snapshot?: string;
  /** Base64 JPEG. */
  screenshot: string;
}

export const DEFAULT_VIEWPORTS: Viewport[] = [
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1440, height: 900 },
];

export const SNAPSHOT_LIMIT = 6_000;

const headless = () => process.env.FRONTEND_STACK_HEADLESS !== 'false';

/** One context per viewport, so mobile emulation (touch, isMobile) is real and not just a resize. */
async function openContext(
  browser: Browser | undefined,
  options: BrowserContextOptions,
  channel: string | undefined,
): Promise<BrowserContext> {
  const userDataDir = process.env.FRONTEND_STACK_USER_DATA_DIR;
  if (userDataDir) return chromium.launchPersistentContext(userDataDir, { headless: headless(), channel, ...options });
  return browser!.newContext(options);
}

export async function verifyPage(opts: VerifyOptions): Promise<ViewportReport[]> {
  const channel = opts.channel ?? process.env.FRONTEND_STACK_CHANNEL;
  const timeout = opts.timeoutMs ?? 30_000;
  const browser = process.env.FRONTEND_STACK_USER_DATA_DIR
    ? undefined
    : await chromium.launch({ headless: headless(), channel });

  const reports: ViewportReport[] = [];
  try {
    for (const vp of opts.viewports ?? DEFAULT_VIEWPORTS) {
      const context = await openContext(
        browser,
        {
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile ?? false,
          hasTouch: vp.hasTouch ?? false,
          deviceScaleFactor: vp.deviceScaleFactor ?? 1,
        },
        channel,
      );
      try {
        const page = await context.newPage();
        const consoleErrors: string[] = [];
        const failedRequests: string[] = [];
        page.on('console', (m) => {
          if (m.type() === 'error') consoleErrors.push(m.text());
        });
        page.on('pageerror', (e) => consoleErrors.push(`Uncaught: ${e.message}`));
        page.on('response', (r) => {
          if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.request().method()} ${r.url()}`);
        });
        page.on('requestfailed', (r) =>
          failedRequests.push(`FAILED ${r.url()} (${r.failure()?.errorText ?? 'unknown'})`),
        );

        await page.goto(opts.url, { waitUntil: 'load', timeout });
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
        if (opts.waitFor) await page.waitForSelector(opts.waitFor, { timeout });

        const { pointer, overflow } = await page.evaluate(() => {
          const root = document.documentElement;
          const offenders: string[] = [];
          for (const el of Array.from(document.body?.querySelectorAll('*') ?? [])) {
            if (offenders.length >= 5) break;
            if (el.getBoundingClientRect().right > root.clientWidth + 1) {
              const id = el.id ? `#${el.id}` : '';
              const cls =
                typeof el.className === 'string' && el.className.trim()
                  ? `.${el.className.trim().split(/\s+/).join('.')}`
                  : '';
              offenders.push(`${el.tagName.toLowerCase()}${id}${cls}`);
            }
          }
          const coarse = matchMedia('(pointer: coarse)').matches;
          const fine = matchMedia('(pointer: fine)').matches;
          return {
            pointer: coarse ? 'coarse' : fine ? 'fine' : 'none',
            overflow: {
              scrollWidth: root.scrollWidth,
              clientWidth: root.clientWidth,
              overflowing: root.scrollWidth > root.clientWidth,
              offenders,
            },
          } as const;
        });

        const axe = await new AxeBuilder({ page }).analyze();
        let snapshot: string | undefined;
        if (opts.snapshot ?? true) {
          const yaml = await page.locator('body').ariaSnapshot({ timeout });
          snapshot = yaml.length > SNAPSHOT_LIMIT ? `${yaml.slice(0, SNAPSHOT_LIMIT)}
... (truncated)` : yaml;
        }
        const shot = await page.screenshot({ fullPage: opts.fullPage ?? false, type: 'jpeg', quality: 80 });

        reports.push({
          viewport: `${vp.name ?? 'viewport'} ${vp.width}x${vp.height}${vp.hasTouch ? ' touch' : ''}`,
          pointer,
          consoleErrors,
          failedRequests,
          overflow,
          a11y: {
            violations: axe.violations.length,
            items: axe.violations.map((v) => ({
              id: v.id,
              impact: v.impact ?? 'unknown',
              help: v.help,
              nodes: v.nodes.length,
            })),
          },
          snapshot,
          screenshot: shot.toString('base64'),
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
  }
  return reports;
}
