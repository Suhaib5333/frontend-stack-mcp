import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SKILL_URL = new URL('../skills/frontend-stack/SKILL.md', import.meta.url);

let cached: string | undefined;

/** The pipeline skill as markdown, without its YAML frontmatter. */
export function loadPipeline(): string {
  cached ??= readFileSync(fileURLToPath(SKILL_URL), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/^---\n[\s\S]*?\n---\n+/, '');
  return cached;
}

/** Style families from the "Style menu" section: { family: [style, ...] }. */
export function listStyles(markdown = loadPipeline()): Record<string, string[]> {
  const menu = markdown.split(/^## Style menu.*$/m)[1]?.split(/^## /m)[0] ?? '';
  const styles: Record<string, string[]> = {};
  for (const match of menu.matchAll(/^\*\*(.+?):\*\*\s*(.+)$/gm)) {
    styles[match[1]] = match[2].split('·').map((s) => s.trim()).filter(Boolean);
  }
  return styles;
}
