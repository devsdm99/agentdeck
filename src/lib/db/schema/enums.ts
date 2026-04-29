import { pgEnum } from 'drizzle-orm/pg-core';

export const repoVisibility = pgEnum('repo_visibility', [
  'public',
  'private',
  'unknown',
]);

export const repoSourceKind = pgEnum('repo_source_kind', [
  'url_public',
  'zip_upload',
  'github_oauth',
  'local_path',
]);

export const scanStatus = pgEnum('scan_status', [
  'pending',
  'running',
  'success',
  'failed',
  'cancelled',
]);

export const scanTrigger = pgEnum('scan_trigger', [
  'manual',
  'webhook',
  'scheduled',
  'api',
]);

export const claudeItemKind = pgEnum('claude_item_kind', [
  'agent',
  'skill',
  'hook',
  'command',
  'output_style',
  'config',
  'other',
]);

export const hookEvent = pgEnum('hook_event', [
  'pre_tool_use',
  'post_tool_use',
  'user_prompt_submit',
  'stop',
  'subagent_stop',
  'pre_compact',
  'notification',
  'session_start',
  'session_end',
]);

export const subscriptionPlan = pgEnum('subscription_plan', [
  'free',
  'pro_monthly',
  'pro_yearly',
]);
