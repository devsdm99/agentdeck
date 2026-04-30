# agentdeck

> Your Claude Code agents, visualized.

Scan any repository with a Claude Code multi-agent setup, parse `.claude/agents/`, `.claude/skills/`, `.claude/hooks/` and `.claude/commands/`, and explore them in a clean visual dashboard. See what each agent does, what tools it uses, what prompts it ships with — without opening twelve markdown files in your editor.

## Status

🟡 **Pre-alpha — week 2.** A real backend already runs: the scanner accepts a public GitHub URL or a `.zip` upload, parses the `.claude/` directory in memory (no `git clone`, no filesystem), and stores a fully-typed snapshot in Postgres. The dashboard UI is the next layer to land. Track progress every Tuesday at the [Multiagente newsletter](https://sergiodima.dev/multiagente).

The full build process — including mistakes, decisions and the multi-agent setup used to write the app itself — is documented in public.

## What it does (today and planned)

- ✅ **Repository scan from GitHub URL** — fetches the tarball from `codeload.github.com`, streams it through `tar-stream` + `zlib`, and parses `.claude/agents/`, `.claude/skills/`, `.claude/hooks/`, `CLAUDE.md`, `AGENTS.md` in memory. Public repos work; private repos via OAuth come later.
- ✅ **Repository scan from zip upload** — same pipeline, different ingest. `JSZip` produces virtual files, the rest is identical.
- ✅ **Typed parsers** — YAML frontmatter for agents and skills, hook events normalized from `settings.json` (`PreToolUse → pre_tool_use`).
- ✅ **Immutable snapshot model** — every scan is a row of its own with timestamps and `sha256` per file. Enables history and diff between scans.
- 🟡 **Visual dashboard** — sortable cards, search, tags, quick filters. *(Coming weeks 3–6.)*
- 🟡 **Agent / skill / hook detail view** — full prompt, tools used, last modified. *(Weeks 3–6.)*
- 🟡 **Diff & history** — compare an item across snapshots. *(Pro feature, week 5+.)*
- 🟡 **Auth & multi-tenant** — Supabase Auth, login/signup, RLS. *(Week 2–3.)*
- 🟡 **Billing** — Stripe, Free + Pro. *(Week 6.)*

## Pricing

agentdeck is **freemium**. The free tier is generous enough to be useful on small projects; paid is for people running multi-agent setups across many repos.

| Plan | Price | What you get |
|---|---|---|
| **Free** | 0 € | 3 repos · 1 active setup · core dashboard |
| **Pro** | 12,99 € / month | Unlimited repos · sync · diff · export · history |
| **Pro Annual** | 109 € / year | Same as Pro, ~30% off vs. monthly |
| **Trial** | 10 days of Pro | No card required at signup |

Pricing is firm but the free tier limits may evolve based on real usage data during the public-build phase.

## Stack

- **Framework:** Next.js 15+ (App Router) + TypeScript strict mode
- **UI:** Tailwind CSS v4 + shadcn/ui (style "new-york", base slate)
- **Database:** Postgres on Supabase
- **ORM:** Drizzle ORM (schema in TypeScript, migrations in SQL)
- **Auth:** Supabase Auth (`@supabase/ssr`) — *coming week 2*
- **Validation:** Zod, including `process.env`
- **Payments:** Stripe — *coming week 6*
- **AI calls:** Anthropic SDK — only where the model itself adds value (e.g. agent quality scoring, summary generation)
- **Hosting:** Vercel
- **Lint:** ESLint 9 flat config + `typescript-eslint` (zero `any`, zero non-null assertions)

The architecture, folder layout and TypeScript discipline are codified as a Claude Code skill: [`.claude/skills/arch-guard/SKILL.md`](.claude/skills/arch-guard/SKILL.md). It activates automatically on any `.ts/.tsx` edit and enforces the rules.

The full multi-agent Claude Code setup used to build this app lives in a separate repo: [agentdeck-claude-setup](https://github.com/devsdm99/agentdeck-claude-setup).

## Roadmap (8-week public build)

| Week | Theme | Status |
|---|---|---|
| 0 | Project announced, repos opened | ✅ Done |
| 1 | First `CLAUDE.md` for agentdeck + first data model | ✅ Done |
| 2 | Scanner end-to-end (URL + zip) + Supabase Auth | 🟡 In progress |
| 3 | First subagent (View Builder), first dashboard pages | 📝 Pending |
| 4 | Skills vs Subagents vs Agent Teams in this stack | 📝 Pending |
| 5 | Pricing decision: free tier limits, Pro features | 📝 Pending |
| 6 | Stripe + first user-facing release (v0.1) | 📝 Pending |
| 7 | Deployed at agentdeck.sergiodima.dev | 📝 Pending |
| 8 | 8-week metrics: what worked, what got cut | 📝 Pending |

## Local development

Requirements: Node 20+, a Supabase project, an `.env.local` with the values listed in [.env.example](.env.example).

```bash
npm install
npm run dev
```

To apply the latest schema to your own Supabase:

```bash
npx drizzle-kit migrate
```

To inspect data, use the **SQL Editor** or **Table Editor** in your Supabase dashboard. Drizzle Studio is intentionally not part of the workflow — see [AGENTS.md](AGENTS.md) for details.

## Follow the build

- Newsletter (Spanish): [sergiodima.dev/multiagente](https://sergiodima.dev/multiagente)
- LinkedIn: [linkedin.com/in/sergio-ds2](https://linkedin.com/in/sergio-ds2)
- Portfolio: [sergiodima.dev](https://sergiodima.dev)
- Setup repo: [agentdeck-claude-setup](https://github.com/devsdm99/agentdeck-claude-setup)

---

Built by [Sergio Díaz](https://sergiodima.dev) — CTO at GetaLink, building agentdeck as a public side project.
