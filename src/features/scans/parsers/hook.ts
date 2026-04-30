import type { ParsedHook, VirtualFile } from '@/shared/types';
import { toHookEvent } from '@/shared/types';

const SETTINGS_PATH_RE = /(^|\/)\.claude\/settings(?:\.local)?\.json$/i;

export function isHookSettingsFile(file: VirtualFile): boolean {
  return SETTINGS_PATH_RE.test(file.path);
}

export function parseHooksFromSettings(file: VirtualFile): ParsedHook[] {
  if (!isHookSettingsFile(file)) return [];

  const text = new TextDecoder().decode(file.bytes);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return [];
  }

  if (!isRecord(json)) return [];
  const hooks = json['hooks'];
  if (!isRecord(hooks)) return [];

  const out: ParsedHook[] = [];
  for (const [eventKey, eventValue] of Object.entries(hooks)) {
    const event = toHookEvent(eventKey);
    if (!event) continue;
    if (!Array.isArray(eventValue)) continue;

    eventValue.forEach((entry, entryIndex) => {
      if (!isRecord(entry)) return;
      const matcher = typeof entry['matcher'] === 'string' ? entry['matcher'] : null;
      const hookList = entry['hooks'];
      if (!Array.isArray(hookList)) return;

      hookList.forEach((hook, hookIndex) => {
        if (!isRecord(hook)) return;
        const command = hook['command'];
        if (typeof command !== 'string' || command.trim().length === 0) return;
        const timeout = hook['timeout'];
        out.push({
          path: file.path,
          event,
          matcher,
          command,
          timeoutMs: typeof timeout === 'number' ? timeout : null,
          runOrder: entryIndex * 1000 + hookIndex,
        });
      });
    });
  }

  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
