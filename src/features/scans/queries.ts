import 'server-only';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import {
  scans,
  scanStats,
  scanFiles,
  scanAgents,
  scanAgentTools,
  scanSkills,
  scanSkillTriggers,
  scanHooks,
} from '@/lib/db/schema';
import type {
  Scan,
  ScanStats,
  ScanFile,
  ScanAgent,
  ScanSkill,
  ScanHook,
} from '@/lib/db/schema';

export type ScanWithStats = {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  trigger: 'manual' | 'webhook' | 'scheduled' | 'api';
  branch: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  errorMessage: string | null;
  agentsCount: number;
  skillsCount: number;
  hooksCount: number;
  totalFiles: number;
};

export async function listScansByRepo(
  repoId: string,
): Promise<ScanWithStats[]> {
  const rows = await db
    .select({
      id: scans.id,
      status: scans.status,
      trigger: scans.trigger,
      branch: scans.branch,
      startedAt: scans.startedAt,
      finishedAt: scans.finishedAt,
      errorMessage: scans.errorMessage,
      agentsCount: scanStats.agentsCount,
      skillsCount: scanStats.skillsCount,
      hooksCount: scanStats.hooksCount,
      totalFiles: scanStats.totalFiles,
    })
    .from(scans)
    .leftJoin(scanStats, eq(scanStats.scanId, scans.id))
    .where(eq(scans.repoId, repoId))
    .orderBy(desc(scans.startedAt));

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    trigger: row.trigger,
    branch: row.branch,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    errorMessage: row.errorMessage,
    agentsCount: row.agentsCount ?? 0,
    skillsCount: row.skillsCount ?? 0,
    hooksCount: row.hooksCount ?? 0,
    totalFiles: row.totalFiles ?? 0,
  }));
}

export type ScanAgentDetail = ScanAgent & {
  tools: string[];
  filePath: string;
  fileSizeBytes: number;
  fileRawContent: string;
};

export type ScanSkillDetail = ScanSkill & {
  triggers: string[];
  filePath: string;
  fileSizeBytes: number;
  fileRawContent: string;
};

export type ScanHookDetail = ScanHook & {
  filePath: string;
};

export type ScanDetail = {
  scan: Scan;
  stats: ScanStats | null;
  files: ScanFile[];
  agents: ScanAgentDetail[];
  skills: ScanSkillDetail[];
  hooks: ScanHookDetail[];
};

export async function getScanDetail(
  scanId: string,
  repoId: string,
): Promise<ScanDetail | null> {
  const scanRows = await db
    .select()
    .from(scans)
    .where(eq(scans.id, scanId))
    .limit(1);
  const scan = scanRows[0];
  if (!scan || scan.repoId !== repoId) return null;

  const [statsRows, filesRows] = await Promise.all([
    db
      .select()
      .from(scanStats)
      .where(eq(scanStats.scanId, scan.id))
      .limit(1),
    db
      .select()
      .from(scanFiles)
      .where(eq(scanFiles.scanId, scan.id))
      .orderBy(asc(scanFiles.path)),
  ]);

  const fileById = new Map<string, ScanFile>();
  for (const file of filesRows) fileById.set(file.id, file);

  const [agentRows, skillRows, hookRows] = await Promise.all([
    db
      .select()
      .from(scanAgents)
      .where(eq(scanAgents.scanId, scan.id))
      .orderBy(asc(scanAgents.name)),
    db
      .select()
      .from(scanSkills)
      .where(eq(scanSkills.scanId, scan.id))
      .orderBy(asc(scanSkills.name)),
    db
      .select()
      .from(scanHooks)
      .where(eq(scanHooks.scanId, scan.id))
      .orderBy(asc(scanHooks.event), asc(scanHooks.runOrder)),
  ]);

  const agentIds = agentRows.map((a) => a.id);
  const skillIds = skillRows.map((s) => s.id);

  const [allTools, allTriggers] = await Promise.all([
    agentIds.length > 0
      ? db
          .select()
          .from(scanAgentTools)
          .where(inIds(scanAgentTools.agentId, agentIds))
      : Promise.resolve([]),
    skillIds.length > 0
      ? db
          .select()
          .from(scanSkillTriggers)
          .where(inIds(scanSkillTriggers.skillId, skillIds))
      : Promise.resolve([]),
  ]);

  const toolsByAgent = new Map<string, string[]>();
  for (const tool of allTools) {
    const list = toolsByAgent.get(tool.agentId) ?? [];
    list.push(tool.toolName);
    toolsByAgent.set(tool.agentId, list);
  }
  const triggersBySkill = new Map<string, string[]>();
  for (const trigger of allTriggers) {
    const list = triggersBySkill.get(trigger.skillId) ?? [];
    list.push(trigger.triggerText);
    triggersBySkill.set(trigger.skillId, list);
  }

  const agents: ScanAgentDetail[] = agentRows.map((agent) => {
    const file = fileById.get(agent.fileId);
    return {
      ...agent,
      tools: (toolsByAgent.get(agent.id) ?? []).sort(),
      filePath: file?.path ?? '(unknown)',
      fileSizeBytes: file?.sizeBytes ?? 0,
      fileRawContent: file?.rawContent ?? '',
    };
  });

  const skills: ScanSkillDetail[] = skillRows.map((skill) => {
    const file = fileById.get(skill.fileId);
    return {
      ...skill,
      triggers: triggersBySkill.get(skill.id) ?? [],
      filePath: file?.path ?? '(unknown)',
      fileSizeBytes: file?.sizeBytes ?? 0,
      fileRawContent: file?.rawContent ?? '',
    };
  });

  const hooks: ScanHookDetail[] = hookRows.map((hook) => {
    const file = fileById.get(hook.fileId);
    return { ...hook, filePath: file?.path ?? '(unknown)' };
  });

  return {
    scan,
    stats: statsRows[0] ?? null,
    files: filesRows,
    agents,
    skills,
    hooks,
  };
}

function inIds(column: PgColumn, ids: string[]) {
  return inArray(column, ids);
}
