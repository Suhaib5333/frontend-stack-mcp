import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { listStyles, loadPipeline } from '../src/pipeline.js';
import { createServer } from '../src/server.js';

async function connect() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverTransport);
  const client = new Client({ name: 'test', version: '0.0.0' });
  await client.connect(clientTransport);
  return client;
}

describe('pipeline', () => {
  it('loads the skill without frontmatter', () => {
    const md = loadPipeline();
    expect(md.startsWith('# Frontend Stack')).toBe(true);
    expect(md).toContain('Rule 0');
    expect(md).toContain('## Style menu');
  });

  it('parses the style menu into families', () => {
    const styles = listStyles();
    expect(Object.keys(styles)).toContain('Editorial');
    expect(styles['Clean/premium']).toContain('minimal');
    expect(Object.values(styles).flat().length).toBeGreaterThan(50);
  });

  it('exposes tools, prompt and resource over MCP', async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(['frontend_stack_pipeline', 'list_styles', 'verify_page']);

    const result = await client.callTool({ name: 'frontend_stack_pipeline', arguments: {} });
    const [first] = result.content as { type: string; text: string }[];
    expect(first.text).toContain('The pipeline');

    const prompt = await client.getPrompt({ name: 'frontend_stack' });
    expect(JSON.stringify(prompt.messages)).toContain('Rule 0');

    const resource = await client.readResource({ uri: 'frontend-stack://pipeline' });
    expect((resource.contents[0] as { text: string }).text).toContain('Style menu');
    await client.close();
  });
});
