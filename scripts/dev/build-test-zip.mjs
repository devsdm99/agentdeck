import JSZip from 'jszip';
import { readFileSync, writeFileSync } from 'node:fs';

const zip = new JSZip();
const root = zip.folder('agentdeck');

const skill = readFileSync('.claude/skills/arch-guard/SKILL.md');
root.file('.claude/skills/arch-guard/SKILL.md', skill);

const agentsMd = readFileSync('AGENTS.md');
root.file('AGENTS.md', agentsMd);

// Add a fake agent and a settings.json for hook coverage
root.file('.claude/agents/view-builder.md', `---
name: view-builder
description: Builds React views from Figma references
model: claude-opus-4-7
tools:
  - Read
  - Write
  - Bash
---

# view-builder

Genera componentes React.
`);

root.file('.claude/settings.json', JSON.stringify({
  hooks: {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [
          { type: 'command', command: 'echo bash hook', timeout: 5000 }
        ]
      }
    ],
    Stop: [
      {
        hooks: [
          { type: 'command', command: 'echo done' }
        ]
      }
    ]
  }
}, null, 2));

const buf = await zip.generateAsync({ type: 'nodebuffer' });
writeFileSync('/tmp/test-agentdeck.zip', buf);
console.log('built /tmp/test-agentdeck.zip', buf.length, 'bytes');
