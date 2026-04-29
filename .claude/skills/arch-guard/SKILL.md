---
name: arch-guard
description: Architecture and TypeScript discipline guard for agentdeck. Use proactively whenever editing or creating .ts/.tsx files in this repo. Enforces the folder layout, the typing rules (no any, no untyped casts, derived types from Drizzle), the Server-only / Client-only boundaries, the import rules between layers, and the schema discipline (no JSON-as-encrypted-table, all enums via pgEnum). Reject changes that violate these rules; offer the compliant alternative instead.
---

# arch-guard — agentdeck architecture & typing discipline

This skill is the contract for how code lives in `agentdeck`. Apply it on every file you create or edit. If a request would force you to break a rule, stop and ask — don't shortcut.

## 1. Folder layout (where things live)

```
src/
├── app/                  Next.js App Router only (route segments, layouts, pages)
│   ├── (marketing)/      Public pages (landing, pricing)
│   ├── (app)/            Authenticated dashboard
│   ├── api/              ONLY external webhooks (Stripe, GitHub) — internal
│   │                     mutations go through Server Actions, never API routes
│   ├── layout.tsx
│   └── globals.css
│
├── components/           React components
│   ├── ui/               shadcn primitives — generated, do not hand-edit
│   ├── layout/           Header, Sidebar, Footer
│   └── features/         Domain components (RepoCard, ScanDiff, …)
│
├── features/             Vertical slices of domain logic
│   └── <feature>/
│       ├── actions.ts    'use server' — Server Actions (mutations)
│       ├── queries.ts    Server-only DB reads
│       ├── schemas.ts    Zod input/output schemas
│       └── service.ts    Pure business logic, no I/O
│
├── lib/                  Infrastructure clients
│   ├── db/
│   │   ├── index.ts      Drizzle client (server-only)
│   │   └── schema/       Split by domain: enums.ts, profiles.ts, repos.ts,
│   │                     scans.ts, relations.ts, index.ts (re-export)
│   ├── supabase/         client.ts (browser), server.ts (server-only)
│   ├── utils.ts          shadcn cn() helper — DO NOT MOVE (shadcn convention)
│   └── env.ts            Zod-validated process.env
│
├── shared/               Cross-feature types and constants
│   ├── types/
│   ├── constants/
│   └── errors.ts         Typed error classes
│
├── utils/                Pure helpers (no project deps): format, slug, etc.
│
└── hooks/                React hooks — Client Components only
```

**Rules:**
- New domain logic goes under `features/<name>/`. Never put it in `app/`.
- New shared types go under `shared/types/`. Never inline a duplicate of a Drizzle type.
- `lib/utils.ts` is the shadcn-managed `cn()` helper. Do not move it; do not put new helpers there. New pure helpers go to `utils/`.
- Route handlers in `app/api/` are reserved for external webhooks. Internal mutations are **Server Actions**.

## 2. Import rules between layers

A layer can import from layers below it, never sideways or upward.

```
app/         → can import from: features, components, lib, shared, utils, hooks
components/  → can import from: lib, shared, utils, hooks (NOT features, NOT app)
features/    → can import from: lib, shared, utils (NOT components, NOT app, NOT other features)
lib/         → can import from: shared, utils (NOT features, NOT components, NOT app)
shared/      → can import from: utils only
utils/       → no project imports (pure)
```

If a `features/a` needs something from `features/b`, lift it to `shared/`.

Always use the `@/` alias. Never `../../..` relative imports.

## 3. Server vs Client boundaries

- Files that read from the DB or use the service-role key MUST start with `import 'server-only';`.
- `features/*/queries.ts` and `features/*/actions.ts` are server-only by default — add `import 'server-only';` at the top.
- Server Actions: file or function starts with `'use server'`.
- Client Components: file starts with `'use client'`. Cannot import from server-only modules.
- Never call DB or service-role Supabase from a Client Component. If a Client Component needs data, it receives it via props from a Server Component or invokes a Server Action.

## 4. Typing rules (zero tolerance)

1. **No `any`.** ESLint rule `@typescript-eslint/no-explicit-any` is `error`.
2. **No untyped `as` casts.** Allowed only at boundaries with external untyped APIs, with a leading `// boundary: <reason>` comment.
3. **DB types come from Drizzle.** Use `typeof table.$inferSelect` / `$inferInsert`. Never redeclare a row shape by hand.
4. **Function signatures are explicit.** Public/exported functions declare parameter and return types. Inferred locals are fine.
5. **Validate inputs at boundaries with Zod.** Server Actions, route handlers, and form parsers parse inputs through a Zod schema; the typed value comes from `z.infer<typeof schema>`.
6. **Discriminated unions over optional fields** when modelling state with mutually exclusive branches (e.g. `{ status: 'success'; data: T } | { status: 'error'; error: E }`).
7. **`unknown` for untyped inputs**, narrow before use. Never `any`.
8. **No non-null assertions (`!`)** outside of test fixtures. If a value can be undefined, handle it.

## 5. Naming

- Components: `PascalCase.tsx` (file name matches component name).
- Functions, variables, hooks: `camelCase`. Hooks: `useThing`.
- Constants: `SCREAMING_SNAKE_CASE`.
- DB tables and columns: `snake_case` (the JS identifier in Drizzle is `camelCase`, the column string is `snake_case`).
- Routes (`app/`): `kebab-case/page.tsx`.
- Env vars: `SCREAMING_SNAKE_CASE`. Public ones prefixed `NEXT_PUBLIC_`.

## 6. Database / schema discipline

- All schema lives in `src/lib/db/schema/`, split by domain. Never write a single monolithic schema file.
- All enumerated string values are `pgEnum`. Never store free-form strings where a finite domain exists.
- If a column would hold a list of structured items that you'd ever want to query, count, or filter — model it as a child table, not as `jsonb` array.
- `jsonb` is allowed ONLY for genuinely heterogeneous user input (e.g. parsed YAML frontmatter where keys are unknown).
- Foreign keys: declare `onDelete` explicitly. `cascade` from owning user down to dependent rows; `restrict` on look-up tables.
- Every FK column has an index (manually if not implied by uniqueness).
- All timestamps `withTimezone: true`.
- Schema changes: edit `schema/*.ts` → `npx drizzle-kit generate` → review SQL → `npx drizzle-kit migrate`. Never `push` in production.

## 7. Error handling and validation

- Errors thrown across module boundaries are instances of typed classes from `shared/errors.ts`.
- Zod `safeParse` over `parse` when the failure is recoverable (form validation). `parse` only when failure should crash (env, internal invariants).
- Never swallow errors silently. If you `catch`, you log structured context and re-throw or return a typed error.

## 8. Component rules

- Server Components by default. Add `'use client'` only when you need state, refs, browser events, or client-only hooks.
- A Client Component never fetches from DB. It receives data as props or calls a Server Action.
- shadcn primitives in `components/ui/` are managed by `npx shadcn add`. Don't hand-edit; if you need a variant, wrap it in `components/features/`.
- No CSS-in-JS. Tailwind v4 only. `cn()` from `lib/utils.ts` for class merging.

## 9. Pre-edit checklist

Before closing any edit to a `.ts`/`.tsx` file in this repo, verify:

- [ ] File is in the correct layer (rule 1).
- [ ] Imports respect the layer rules (rule 2).
- [ ] Server-only modules start with `import 'server-only';` (rule 3).
- [ ] No `any`, no untyped `as`, no `!` non-null assertion (rule 4).
- [ ] Public exports have explicit types (rule 4).
- [ ] If touching schema: enums via `pgEnum`, no JSON-as-table, FK indexes, `withTimezone: true` (rule 6).
- [ ] If adding inputs: validated by Zod (rule 5/7).

If any box is unchecked, fix it before the file ships.

## 10. When in doubt

If a request from the user pushes you to break a rule (e.g. "just put it in a JSON column for now"), do not silently comply. Surface the trade-off and the compliant alternative; let the user decide explicitly. Architecture decay starts with one quiet exception.
