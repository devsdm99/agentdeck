import { sha256Hex } from '@/utils/hash';
import type { ParsedAgent, VirtualFile } from '@/shared/types';
import { asString, asStringArray, parseFrontmatter } from './frontmatter';

const AGENT_PATH_RE = /(^|\/)\.claude\/agents\/([^/]+)\.md$/i;

export function isAgentFile(file: VirtualFile): boolean {
  return AGENT_PATH_RE.test(file.path);
}

export function parseAgent(file: VirtualFile): ParsedAgent | null {
  const match = file.path.match(AGENT_PATH_RE);
  if (!match) return null;

  const rawContent = new TextDecoder().decode(file.bytes);
  const { frontmatter, body } = parseFrontmatter(rawContent);

  const fallbackName = match[2];
  const name = asString(frontmatter['name']) ?? fallbackName;
  const description = asString(frontmatter['description']);
  const model = asString(frontmatter['model']);
  const tools = parseAgentTools(frontmatter['tools']);

  return {
    path: file.path,
    name,
    description,
    model,
    tools,
    frontmatter,
    bodyMd: body,
    rawContent,
    sizeBytes: file.bytes.byteLength,
    sha256: sha256Hex(file.bytes),
  };
}

function parseAgentTools(value: unknown): string[] {
  if (Array.isArray(value)) {
    return asStringArray(value);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  return [];
}
