import type { HookEvent } from './enums';

export type VirtualFile = {
  path: string;
  bytes: Uint8Array;
};

export type ParsedAgent = {
  path: string;
  name: string;
  description: string | null;
  model: string | null;
  tools: string[];
  frontmatter: Record<string, unknown>;
  bodyMd: string;
  rawContent: string;
  sizeBytes: number;
  sha256: string;
};

export type ParsedSkill = {
  path: string;
  name: string;
  description: string | null;
  triggers: string[];
  frontmatter: Record<string, unknown>;
  bodyMd: string;
  rawContent: string;
  sizeBytes: number;
  sha256: string;
};

export type ParsedHook = {
  path: string;
  event: HookEvent;
  matcher: string | null;
  command: string;
  timeoutMs: number | null;
  runOrder: number;
};

export type ParsedFile = {
  path: string;
  kind: 'agent' | 'skill' | 'hook' | 'command' | 'output_style' | 'config' | 'other';
  rawContent: string;
  sizeBytes: number;
  sha256: string;
};

export type ParsedScan = {
  files: ParsedFile[];
  agents: ParsedAgent[];
  skills: ParsedSkill[];
  hooks: ParsedHook[];
  claudeMdRaw: string | null;
  agentsMdRaw: string | null;
  stats: {
    agentsCount: number;
    skillsCount: number;
    hooksCount: number;
    commandsCount: number;
    outputStylesCount: number;
    totalFiles: number;
    totalSizeBytes: number;
  };
};
