import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scans, scanStats } from '@/lib/db/schema';

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
