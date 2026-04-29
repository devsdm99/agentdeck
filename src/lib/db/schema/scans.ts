import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { repos, repoSources } from './repos';
import { claudeItemKind, hookEvent, scanStatus, scanTrigger } from './enums';

export const scans = pgTable(
  'scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repoId: uuid('repo_id')
      .notNull()
      .references(() => repos.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => repoSources.id, { onDelete: 'restrict' }),
    status: scanStatus('status').default('pending').notNull(),
    trigger: scanTrigger('trigger').default('manual').notNull(),
    commitSha: text('commit_sha'),
    branch: text('branch'),
    claudeMdRaw: text('claude_md_raw'),
    agentsMdRaw: text('agents_md_raw'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [
    index('scans_repo_started_idx').on(table.repoId, table.startedAt),
    index('scans_status_idx').on(table.status),
  ],
);

export const scanStats = pgTable('scan_stats', {
  scanId: uuid('scan_id')
    .primaryKey()
    .references(() => scans.id, { onDelete: 'cascade' }),
  agentsCount: integer('agents_count').default(0).notNull(),
  skillsCount: integer('skills_count').default(0).notNull(),
  hooksCount: integer('hooks_count').default(0).notNull(),
  commandsCount: integer('commands_count').default(0).notNull(),
  outputStylesCount: integer('output_styles_count').default(0).notNull(),
  totalFiles: integer('total_files').default(0).notNull(),
  totalSizeBytes: bigint('total_size_bytes', { mode: 'number' })
    .default(0)
    .notNull(),
});

export const scanFiles = pgTable(
  'scan_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    kind: claudeItemKind('kind').notNull(),
    sizeBytes: integer('size_bytes').default(0).notNull(),
    sha256: text('sha256').notNull(),
    rawContent: text('raw_content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('scan_files_scan_path_unique').on(table.scanId, table.path),
    index('scan_files_kind_idx').on(table.scanId, table.kind),
  ],
);

export const scanAgents = pgTable(
  'scan_agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => scanFiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    model: text('model'),
    frontmatter: jsonb('frontmatter'),
    bodyMd: text('body_md'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('scan_agents_scan_name_unique').on(table.scanId, table.name),
    index('scan_agents_scan_idx').on(table.scanId),
  ],
);

export const scanAgentTools = pgTable(
  'scan_agent_tools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => scanAgents.id, { onDelete: 'cascade' }),
    toolName: text('tool_name').notNull(),
  },
  (table) => [
    uniqueIndex('scan_agent_tools_agent_tool_unique').on(
      table.agentId,
      table.toolName,
    ),
    index('scan_agent_tools_tool_idx').on(table.toolName),
  ],
);

export const scanSkills = pgTable(
  'scan_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => scanFiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    frontmatter: jsonb('frontmatter'),
    bodyMd: text('body_md'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('scan_skills_scan_name_unique').on(table.scanId, table.name),
    index('scan_skills_scan_idx').on(table.scanId),
  ],
);

export const scanSkillTriggers = pgTable(
  'scan_skill_triggers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => scanSkills.id, { onDelete: 'cascade' }),
    triggerText: text('trigger_text').notNull(),
  },
  (table) => [index('scan_skill_triggers_skill_idx').on(table.skillId)],
);

export const scanHooks = pgTable(
  'scan_hooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => scanFiles.id, { onDelete: 'cascade' }),
    event: hookEvent('event').notNull(),
    matcher: text('matcher'),
    command: text('command').notNull(),
    timeoutMs: integer('timeout_ms'),
    runOrder: integer('run_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('scan_hooks_scan_event_idx').on(table.scanId, table.event),
  ],
);

export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type ScanStats = typeof scanStats.$inferSelect;
export type NewScanStats = typeof scanStats.$inferInsert;
export type ScanFile = typeof scanFiles.$inferSelect;
export type NewScanFile = typeof scanFiles.$inferInsert;
export type ScanAgent = typeof scanAgents.$inferSelect;
export type NewScanAgent = typeof scanAgents.$inferInsert;
export type ScanAgentTool = typeof scanAgentTools.$inferSelect;
export type NewScanAgentTool = typeof scanAgentTools.$inferInsert;
export type ScanSkill = typeof scanSkills.$inferSelect;
export type NewScanSkill = typeof scanSkills.$inferInsert;
export type ScanSkillTrigger = typeof scanSkillTriggers.$inferSelect;
export type NewScanSkillTrigger = typeof scanSkillTriggers.$inferInsert;
export type ScanHook = typeof scanHooks.$inferSelect;
export type NewScanHook = typeof scanHooks.$inferInsert;
