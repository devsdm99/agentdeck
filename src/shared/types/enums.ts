export type HookEvent =
  | 'pre_tool_use'
  | 'post_tool_use'
  | 'user_prompt_submit'
  | 'stop'
  | 'subagent_stop'
  | 'pre_compact'
  | 'notification'
  | 'session_start'
  | 'session_end';

export type ClaudeItemKind =
  | 'agent'
  | 'skill'
  | 'hook'
  | 'command'
  | 'output_style'
  | 'config'
  | 'other';

export const HOOK_EVENT_VALUES: readonly HookEvent[] = [
  'pre_tool_use',
  'post_tool_use',
  'user_prompt_submit',
  'stop',
  'subagent_stop',
  'pre_compact',
  'notification',
  'session_start',
  'session_end',
] as const;

export function toHookEvent(raw: string): HookEvent | null {
  const snake = raw
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
  return (HOOK_EVENT_VALUES as readonly string[]).includes(snake)
    ? (snake as HookEvent)
    : null;
}
