import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { repoSourceKind, repoVisibility } from './enums';

export const repos = pgTable(
  'repos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    visibility: repoVisibility('visibility').default('unknown').notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('repos_user_slug_unique').on(table.userId, table.slug),
    index('repos_user_idx').on(table.userId),
  ],
);

export const repoSources = pgTable(
  'repo_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repoId: uuid('repo_id')
      .notNull()
      .references(() => repos.id, { onDelete: 'cascade' }),
    kind: repoSourceKind('kind').notNull(),
    url: text('url'),
    defaultBranch: text('default_branch'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('repo_sources_repo_idx').on(table.repoId)],
);

export type Repo = typeof repos.$inferSelect;
export type NewRepo = typeof repos.$inferInsert;

export type RepoSource = typeof repoSources.$inferSelect;
export type NewRepoSource = typeof repoSources.$inferInsert;
