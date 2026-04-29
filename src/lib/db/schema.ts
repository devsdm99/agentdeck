import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Esquema mínimo viable. Se expandirá en semana 2-3 cuando definamos
// el modelo de "repo escaneado", "agente parseado", "snapshot", etc.

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // mismo id que auth.users de Supabase
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
