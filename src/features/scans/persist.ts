import 'server-only';
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
import type { ParsedScan } from '@/shared/types';

export type PersistScanInput = {
  repoId: string;
  sourceId: string;
  trigger: 'manual' | 'webhook' | 'scheduled' | 'api';
  branch: string | null;
  commitSha: string | null;
  parsed: ParsedScan;
};

export type PersistScanResult = {
  scanId: string;
};

export async function persistScan(
  input: PersistScanInput,
): Promise<PersistScanResult> {
  const finishedAt = new Date();

  return db.transaction(async (tx) => {
    const [insertedScan] = await tx
      .insert(scans)
      .values({
        repoId: input.repoId,
        sourceId: input.sourceId,
        status: 'success',
        trigger: input.trigger,
        branch: input.branch,
        commitSha: input.commitSha,
        claudeMdRaw: input.parsed.claudeMdRaw,
        agentsMdRaw: input.parsed.agentsMdRaw,
        finishedAt,
      })
      .returning({ id: scans.id });

    const scanId = insertedScan.id;

    await tx.insert(scanStats).values({
      scanId,
      agentsCount: input.parsed.stats.agentsCount,
      skillsCount: input.parsed.stats.skillsCount,
      hooksCount: input.parsed.stats.hooksCount,
      commandsCount: input.parsed.stats.commandsCount,
      outputStylesCount: input.parsed.stats.outputStylesCount,
      totalFiles: input.parsed.stats.totalFiles,
      totalSizeBytes: input.parsed.stats.totalSizeBytes,
    });

    const fileIdByPath = new Map<string, string>();
    if (input.parsed.files.length > 0) {
      const insertedFiles = await tx
        .insert(scanFiles)
        .values(
          input.parsed.files.map((file) => ({
            scanId,
            path: file.path,
            kind: file.kind,
            sizeBytes: file.sizeBytes,
            sha256: file.sha256,
            rawContent: file.rawContent,
          })),
        )
        .returning({ id: scanFiles.id, path: scanFiles.path });

      for (const row of insertedFiles) {
        fileIdByPath.set(row.path, row.id);
      }
    }

    const agentIdByName = new Map<string, string>();
    if (input.parsed.agents.length > 0) {
      const agentRows = input.parsed.agents
        .map((agent) => {
          const fileId = fileIdByPath.get(agent.path);
          if (!fileId) return null;
          return {
            scanId,
            fileId,
            name: agent.name,
            description: agent.description,
            model: agent.model,
            frontmatter: agent.frontmatter,
            bodyMd: agent.bodyMd,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (agentRows.length > 0) {
        const inserted = await tx
          .insert(scanAgents)
          .values(agentRows)
          .returning({ id: scanAgents.id, name: scanAgents.name });
        for (const row of inserted) agentIdByName.set(row.name, row.id);
      }

      const toolRows: { agentId: string; toolName: string }[] = [];
      for (const agent of input.parsed.agents) {
        const agentId = agentIdByName.get(agent.name);
        if (!agentId) continue;
        const seen = new Set<string>();
        for (const tool of agent.tools) {
          if (seen.has(tool)) continue;
          seen.add(tool);
          toolRows.push({ agentId, toolName: tool });
        }
      }
      if (toolRows.length > 0) {
        await tx.insert(scanAgentTools).values(toolRows);
      }
    }

    const skillIdByName = new Map<string, string>();
    if (input.parsed.skills.length > 0) {
      const skillRows = input.parsed.skills
        .map((skill) => {
          const fileId = fileIdByPath.get(skill.path);
          if (!fileId) return null;
          return {
            scanId,
            fileId,
            name: skill.name,
            description: skill.description,
            frontmatter: skill.frontmatter,
            bodyMd: skill.bodyMd,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (skillRows.length > 0) {
        const inserted = await tx
          .insert(scanSkills)
          .values(skillRows)
          .returning({ id: scanSkills.id, name: scanSkills.name });
        for (const row of inserted) skillIdByName.set(row.name, row.id);
      }

      const triggerRows: { skillId: string; triggerText: string }[] = [];
      for (const skill of input.parsed.skills) {
        const skillId = skillIdByName.get(skill.name);
        if (!skillId) continue;
        for (const trigger of skill.triggers) {
          triggerRows.push({ skillId, triggerText: trigger });
        }
      }
      if (triggerRows.length > 0) {
        await tx.insert(scanSkillTriggers).values(triggerRows);
      }
    }

    if (input.parsed.hooks.length > 0) {
      const hookRows = input.parsed.hooks
        .map((hook) => {
          const fileId = fileIdByPath.get(hook.path);
          if (!fileId) return null;
          return {
            scanId,
            fileId,
            event: hook.event,
            matcher: hook.matcher,
            command: hook.command,
            timeoutMs: hook.timeoutMs,
            runOrder: hook.runOrder,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (hookRows.length > 0) {
        await tx.insert(scanHooks).values(hookRows);
      }
    }

    return { scanId };
  });
}
