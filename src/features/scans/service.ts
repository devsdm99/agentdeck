import { sha256Hex } from '@/utils/hash';
import type { ParsedFile, ParsedScan, VirtualFile } from '@/shared/types';
import type { ClaudeItemKind } from '@/shared/types';
import { isAgentFile, parseAgent } from './parsers/agent';
import { isHookSettingsFile, parseHooksFromSettings } from './parsers/hook';
import { isSkillFile, parseSkill } from './parsers/skill';
import { isInterestingClaudePath } from './ingest/path-filter';

const ROOT_CLAUDE_MD = /(^|\/)CLAUDE\.md$/i;
const ROOT_AGENTS_MD = /(^|\/)AGENTS\.md$/i;

export function parseClaudeDirectory(input: VirtualFile[]): ParsedScan {
  const normalized = input.map((f) => ({ ...f, path: normalize(f.path) }));
  const claudeFiles = normalized.filter((f) => isInterestingClaudePath(f.path));

  const agents = claudeFiles
    .filter(isAgentFile)
    .map(parseAgent)
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const skills = claudeFiles
    .filter(isSkillFile)
    .map(parseSkill)
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const hookFiles = claudeFiles.filter(isHookSettingsFile);
  const hooks = hookFiles.flatMap(parseHooksFromSettings);

  const agentPaths = new Set(agents.map((a) => a.path));
  const skillPaths = new Set(skills.map((s) => s.path));

  const files: ParsedFile[] = claudeFiles
    .filter((file) => isFileWorthPersisting(file, agentPaths, skillPaths))
    .map((file) => {
      const rawContent = new TextDecoder().decode(file.bytes);
      return {
        path: file.path,
        kind: classifyFile(file, agentPaths, skillPaths),
        rawContent,
        sizeBytes: file.bytes.byteLength,
        sha256: sha256Hex(file.bytes),
      };
    });

  const claudeMdRaw = pickRootMarkdown(normalized, ROOT_CLAUDE_MD);
  const agentsMdRaw = pickRootMarkdown(normalized, ROOT_AGENTS_MD);

  const stats = {
    agentsCount: agents.length,
    skillsCount: skills.length,
    hooksCount: hooks.length,
    commandsCount: files.filter((f) => f.kind === 'command').length,
    outputStylesCount: files.filter((f) => f.kind === 'output_style').length,
    totalFiles: files.length,
    totalSizeBytes: files.reduce((acc, f) => acc + f.sizeBytes, 0),
  };

  return { files, agents, skills, hooks, claudeMdRaw, agentsMdRaw, stats };
}

function isFileWorthPersisting(
  file: VirtualFile,
  agentPaths: Set<string>,
  skillPaths: Set<string>,
): boolean {
  const path = file.path;
  if (path.includes('.claude/')) return true;
  if (agentPaths.has(path) || skillPaths.has(path)) return true;
  return false;
}

function classifyFile(
  file: VirtualFile,
  agentPaths: Set<string>,
  skillPaths: Set<string>,
): ClaudeItemKind {
  const path = file.path;
  if (agentPaths.has(path)) return 'agent';
  if (skillPaths.has(path)) return 'skill';
  if (isHookSettingsFile(file)) return 'config';
  if (/\.claude\/commands\//i.test(path)) return 'command';
  if (/\.claude\/output-styles\//i.test(path)) return 'output_style';
  if (/\.claude\/settings(?:\.local)?\.json$/i.test(path)) return 'config';
  return 'other';
}

function pickRootMarkdown(
  files: VirtualFile[],
  pattern: RegExp,
): string | null {
  const candidates = files
    .filter((f) => pattern.test(f.path))
    .sort((a, b) => a.path.length - b.path.length);
  if (candidates.length === 0) return null;
  return new TextDecoder().decode(candidates[0].bytes);
}

function normalize(path: string): string {
  return path.startsWith('./') ? path.slice(2) : path;
}
