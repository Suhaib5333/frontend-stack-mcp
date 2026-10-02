import { readFileSync } from 'node:fs';
import { createServer as createHttpServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';

const fixture = readFileSync(new URL('./fixtures/broken.html', import.meta.url), 'utf8');

let http: Server;
let baseUrl: string;
let client: Client;

beforeAll(async () => {
  http = createHttpServer((req, res) => {
    if (req.url === '/' || req.url === '/broken.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(fixture);
    } else {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
    }
  });
  await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverTransport);
  client = new Client({ name: 'test', version: '0.0.0' });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client?.close();
  await new Promise((resolve) => http?.close(resolve));
});

describe('verify_page', () => {
  it('detects console errors, failed requests, overflow and a11y issues at both viewports', async () => {
    const result = await client.callTool({ name: 'verify_page', arguments: { url: `${baseUrl}/broken.html` } });
    expect(result.isError).toBeFalsy();

    const content = result.content as { type: string; text?: string; data?: string; mimeType?: string }[];
    const reports = content.filter((c) => c.type === 'text').map((c) => JSON.parse(c.text!));
    const images = content.filter((c) => c.type === 'image');

    expect(reports).toHaveLength(2);
    expect(images).toHaveLength(2);
    expect(images[0].mimeType).toBe('image/jpeg');
    expect(images[0].data!.length).toBeGreaterThan(1000);

    const [mobile, desktop] = reports;
    expect(mobile.viewport).toContain('390x844');
    expect(desktop.viewport).toContain('1440x900');
    expect(mobile.pointer).toBe('coarse');
    expect(desktop.pointer).toBe('fine');

    for (const r of reports) {
      expect(r.consoleErrors.join('\n')).toContain('fixture console error');
      expect(r.failedRequests.join('\n')).toMatch(/404 GET .*\/missing\.json/);
      expect(r.overflow.overflowing).toBe(true);
      expect(r.overflow.scrollWidth).toBeGreaterThan(r.overflow.clientWidth);
      expect(r.overflow.offenders).toContain('div#too-wide');
      expect(r.snapshot).toContain('Fixture page with known problems');
      expect(r.a11y.items.map((i: { id: string }) => i.id)).toContain('image-alt');
    }
  });

  it('returns an isError result instead of throwing for an unreachable URL', async () => {
    const result = await client.callTool({
      name: 'verify_page',
      arguments: { url: 'http://127.0.0.1:1/', viewports: [{ width: 800, height: 600 }] },
    });
    expect(result.isError).toBe(true);
    const [first] = result.content as { type: string; text: string }[];
    expect(first.text).toContain('verify_page failed');
  });
});
