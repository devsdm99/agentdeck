import { relations } from 'drizzle-orm';
import { profiles } from './profiles';
import { repos, repoSources } from './repos';
import {
  scans,
  scanStats,
  scanFiles,
  scanAgents,
  scanAgentTools,
  scanSkills,
  scanSkillTriggers,
  scanHooks,
} from './scans';

export const profilesRelations = relations(profiles, ({ many }) => ({
  repos: many(repos),
}));

export const reposRelations = relations(repos, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [repos.userId],
    references: [profiles.id],
  }),
  sources: many(repoSources),
  scans: many(scans),
}));

export const repoSourcesRelations = relations(repoSources, ({ one, many }) => ({
  repo: one(repos, {
    fields: [repoSources.repoId],
    references: [repos.id],
  }),
  scans: many(scans),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
  repo: one(repos, {
    fields: [scans.repoId],
    references: [repos.id],
  }),
  source: one(repoSources, {
    fields: [scans.sourceId],
    references: [repoSources.id],
  }),
  stats: one(scanStats, {
    fields: [scans.id],
    references: [scanStats.scanId],
  }),
  files: many(scanFiles),
  agents: many(scanAgents),
  skills: many(scanSkills),
  hooks: many(scanHooks),
}));

export const scanStatsRelations = relations(scanStats, ({ one }) => ({
  scan: one(scans, {
    fields: [scanStats.scanId],
    references: [scans.id],
  }),
}));

export const scanFilesRelations = relations(scanFiles, ({ one, many }) => ({
  scan: one(scans, {
    fields: [scanFiles.scanId],
    references: [scans.id],
  }),
  agents: many(scanAgents),
  skills: many(scanSkills),
  hooks: many(scanHooks),
}));

export const scanAgentsRelations = relations(scanAgents, ({ one, many }) => ({
  scan: one(scans, {
    fields: [scanAgents.scanId],
    references: [scans.id],
  }),
  file: one(scanFiles, {
    fields: [scanAgents.fileId],
    references: [scanFiles.id],
  }),
  tools: many(scanAgentTools),
}));

export const scanAgentToolsRelations = relations(scanAgentTools, ({ one }) => ({
  agent: one(scanAgents, {
    fields: [scanAgentTools.agentId],
    references: [scanAgents.id],
  }),
}));

export const scanSkillsRelations = relations(scanSkills, ({ one, many }) => ({
  scan: one(scans, {
    fields: [scanSkills.scanId],
    references: [scans.id],
  }),
  file: one(scanFiles, {
    fields: [scanSkills.fileId],
    references: [scanFiles.id],
  }),
  triggers: many(scanSkillTriggers),
}));

export const scanSkillTriggersRelations = relations(
  scanSkillTriggers,
  ({ one }) => ({
    skill: one(scanSkills, {
      fields: [scanSkillTriggers.skillId],
      references: [scanSkills.id],
    }),
  }),
);

export const scanHooksRelations = relations(scanHooks, ({ one }) => ({
  scan: one(scans, {
    fields: [scanHooks.scanId],
    references: [scans.id],
  }),
  file: one(scanFiles, {
    fields: [scanHooks.fileId],
    references: [scanFiles.id],
  }),
}));
