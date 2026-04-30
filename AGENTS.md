<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 15+ with App Router) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# agentdeck

Web app que escanea repositorios con setup multi-agente Claude Code (`.claude/agents/`, `.claude/skills/`, `.claude/hooks/`) y los visualiza en un dashboard limpio. Producto público, freemium (Free + Pro 12,99€/mes).

Construido en público durante 8 semanas con un equipo de 6 agentes Claude Code que también se montan en público. Acompañado por la newsletter [Multiagente](https://sergiodima.dev/multiagente).

## Stack

- **Framework:** Next.js 15+ (App Router) + TypeScript estricto
- **UI:** Tailwind CSS v4 + shadcn/ui (estilo "new-york", base slate)
- **DB:** Postgres en **Supabase** + **Drizzle ORM**
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **Validación:** Zod (incluyendo `process.env`)
- **Lint:** ESLint 9 flat config + `typescript-eslint` + plugin oficial de Next
- **Pagos (semana 6+):** Stripe
- **AI calls:** Anthropic SDK (solo donde aporte: scoring, summaries)
- **Hosting:** Vercel

## Disciplina arquitectónica

La estructura, las reglas de tipado y los límites entre capas están **codificados como skill** en `.claude/skills/arch-guard/SKILL.md`. Esa es la fuente de verdad. Lee y aplica `arch-guard` cuando edites cualquier `.ts`/`.tsx` del repo.

Resumen de las reglas (consultar `arch-guard` para el detalle):

- **Folder layout:** `src/app` (rutas) · `src/components` (UI) · `src/features` (lógica de dominio en vertical slices) · `src/lib` (infraestructura, DB, env) · `src/shared` (tipos/errores cross-feature) · `src/utils` (helpers puros) · `src/hooks` (React hooks).
- **Server vs Client:** Server Components por defecto. DB y service-role solo en módulos con `import 'server-only'`. Mutaciones vía Server Actions, no API routes (salvo webhooks externos).
- **Tipado:** cero `any`, cero `!` non-null assertion, cero `as` sin justificación. Tipos de DB derivados de Drizzle (`$inferSelect`/`$inferInsert`). Inputs validados con Zod.
- **Schema:** dividido por dominio en `src/lib/db/schema/`. Todos los enums vía `pgEnum`. Listas estructuradas → tabla hija, no `jsonb`. `jsonb` solo para input verdaderamente heterogéneo (frontmatter YAML).
- **Imports:** alias `@/`. Nunca rutas relativas con `../../..`. Las capas inferiores no importan de las superiores.

## Estructura

```
src/
├── app/                         App Router (rutas, layouts, pages)
│   ├── (marketing)/             Landing pública
│   ├── (app)/                   Dashboard autenticado
│   ├── api/                     Solo webhooks externos (Stripe, GitHub)
│   └── ...
├── components/
│   ├── ui/                      shadcn (auto-generado)
│   ├── layout/                  Header, Sidebar, Footer
│   └── features/                Componentes de dominio
├── features/                    Vertical slices: actions/queries/schemas/service
│   ├── repos/
│   ├── scans/
│   ├── auth/
│   └── billing/
├── lib/
│   ├── db/
│   │   ├── index.ts             Drizzle client (server-only)
│   │   └── schema/              Schema dividido por dominio
│   │       ├── enums.ts
│   │       ├── profiles.ts
│   │       ├── repos.ts
│   │       ├── scans.ts
│   │       ├── relations.ts
│   │       └── index.ts
│   ├── supabase/
│   │   ├── client.ts            Cliente browser
│   │   └── server.ts            Cliente servidor (server-only)
│   ├── utils.ts                 cn() helper de shadcn (NO MOVER)
│   └── env.ts                   process.env validado con Zod
├── shared/
│   ├── types/
│   ├── constants/
│   └── errors.ts                Clases de error tipadas
├── utils/                       Helpers puros sin deps de proyecto
└── hooks/                       React hooks (Client only)
```

## Variables de entorno

Ver `.env.example`. Copiar a `.env.local` y rellenar. Validadas en runtime con Zod (`src/lib/env.ts`):

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — JWT pública (frontend)
- `SUPABASE_SERVICE_ROLE_KEY` — JWT privada (server, bypass RLS) — NUNCA en código cliente
- `DATABASE_URL` — Postgres del **pooler** de Supabase (puerto 6543), usado tanto en runtime como en drizzle-kit. Es IPv4-routable.
- `DIRECT_URL` — opcional, conexión directa puerto 5432 (IPv6-only desde Q4 2024). Solo útil desde redes con IPv6 público (algunos deploys de Vercel/GitHub Actions). Desde redes sin IPv6 NO funciona y `drizzle-kit` se cuelga sin error — usar siempre `DATABASE_URL` en ese caso.
- `ANTHROPIC_API_KEY` — opcional hasta semana 3+
- `STRIPE_*` — opcional hasta semana 6

**Nunca commiteamos `.env.local`** (está en `.gitignore`).

## Comandos

```bash
npm run dev                 # Dev server
npm run build               # Build producción
npm run lint                # ESLint (cero any, cero non-null assertion, etc.)
npm run typecheck           # tsc --noEmit
npx drizzle-kit generate    # Generar migración SQL desde schema/
npx drizzle-kit migrate     # Aplicar migraciones a la DB
npx shadcn@latest add <c>   # Añadir componente shadcn
```

Para inspeccionar datos en la DB se usa el SQL Editor del dashboard de Supabase, o cualquier cliente Postgres apuntando al `DATABASE_URL`. **Drizzle Studio queda fuera del flujo** — tiene problemas con el pooler de Supabase (Mixed Content / Private Network Access) y no aporta sobre lo que ya da Supabase.

## Build-in-public

Este repo se construye en público durante 8 semanas. El setup multi-agente que escribe este código vive en su propio repo: [agentdeck-claude-setup](https://github.com/devsdm99/agentdeck-claude-setup). Cada cambio significativo se commitea con mensaje útil para el post de la semana correspondiente.
