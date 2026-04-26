# agentdeck

> Your Claude Code agents, visualized.

Scan any repository with a Claude Code multi-agent setup, parse `.claude/agents/`, `.claude/skills/` and `.claude/hooks/`, and explore them in a clean visual dashboard. See what each agent does, what tools it uses, what prompts it ships with, and how they interact — without opening 12 markdown files in your editor.

## Status

🟡 **Pre-alpha — week 0.** This repo currently contains only the README, license and roadmap. The app is being built in public, one week at a time. Track progress at the [Multiagente newsletter](https://sergiodima.dev/multiagente).

The full build process — including mistakes, decisions and the multi-agent setup used to write the app itself — is documented every Tuesday at [sergiodima.dev/multiagente](https://sergiodima.dev/multiagente).

## What it does (planned)

- **Repository scan** — point agentdeck at a repo with `.claude/` and it parses every agent, skill, hook
- **Visual dashboard** — sortable cards, search, tags, quick filters
- **Agent detail view** — full prompt, tools, dependencies, last modified
- **Diff & history** — compare an agent across commits, see how the prompt evolved
- **Export** — markdown, JSON, or shareable public links
- **Multi-repo** — keep track of agentdeck setups across all your projects in one place

## Pricing

agentdeck is **freemium**. The free tier is generous enough to be useful on small projects; paid is for people running multi-agent setups across many repos.

| Plan | Price | What you get |
|---|---|---|
| **Free** | 0 € | 3 repos · 1 active setup · core dashboard |
| **Pro** | 12,99 € / month | Unlimited repos · sync · diff · export · history |
| **Pro Annual** | 109 € / year | Same as Pro, ~30% off vs. monthly |
| **Trial** | 10 days of Pro | No card required at signup |

Pricing is final but the free tier limits may evolve based on real usage data during the public-build phase.

## License

agentdeck is published under the **Business Source License 1.1 (BSL 1.1)** — see [LICENSE](./LICENSE).

In plain language:

- ✅ You can read all the code, learn from it, run it locally for personal or internal use, and contribute back
- ✅ You can fork it, study it, modify it, build on top of it
- ❌ You **cannot** offer agentdeck (or a substantially similar product based on this code) as a hosted commercial service to third parties
- 🔓 On **2030-04-26** (4 years from this commit), the license automatically converts to **MIT** and all restrictions disappear

This model is used by Sentry, MariaDB, CockroachDB and n8n. The goal is simple: keep the code open and auditable while protecting the project's ability to fund itself during the early years.

## Built with

- **Astro** — static site + content layer
- **React** — interactive islands
- **Tailwind CSS** — styling
- **Anthropic SDK** — only where the model itself adds value (e.g. agent quality scoring, summary generation)
- **Cloudflare Pages** — hosting

The full multi-agent Claude Code setup used to build this app lives in a separate repo: [agentdeck-claude-setup](https://github.com/devsdm99/agentdeck-claude-setup).

## Roadmap (8-week public build)

| Week | Theme | Output |
|---|---|---|
| 1 | First `CLAUDE.md` for agentdeck | Real config committed |
| 2 | First subagent: View Builder | Prompt + tooling explained |
| 3 | Skills vs Subagents vs Agent Teams in this stack | Working examples in repo |
| 4 | Preventing two agents from editing the same file | Hooks demo |
| 5 | First big mistake (there will be one) | Post-mortem |
| 6 | Pricing decision: free tier limits, Pro features | Discussed in public |
| 7 | First user-facing release | v0.1 deployed |
| 8 | 8-week metrics: what worked, what got cut | Honest report |

## Follow the build

- 📰 Newsletter (Spanish): [sergiodima.dev/multiagente](https://sergiodima.dev/multiagente)
- 🐦 X: follow [@sergio_ds2](https://x.com/) (or whatever handle you actually use)
- 💼 LinkedIn: [linkedin.com/in/sergio-ds2](https://linkedin.com/in/sergio-ds2)
- 🛠️ Setup repo: [agentdeck-claude-setup](https://github.com/devsdm99/agentdeck-claude-setup)

---

Built by [Sergio Díaz](https://sergiodima.dev) — CTO at GetaLink, building agentdeck as a public side project.
