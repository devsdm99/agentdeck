<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 15+ with App Router) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# agentdeck

Web app que escanea repositorios con setup multi-agente Claude Code (`.claude/agents/`, `.claude/skills/`, `.claude/hooks/`) y los visualiza en un dashboard limpio. Producto público, freemium (Free + Pro 12,99€/mes).

Construido en público durante 8 semanas con un equipo de 6 agentes Claude Code que también se montan en público. Acompañado por la newsletter [Multiagente](https://sergiodima.dev/multiagente).

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **UI:** Tailwind CSS v4 + shadcn/ui (estilo "new-york", base slate)
- **DB:** Postgres en **Supabase** + **Drizzle ORM**
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **Validación:** Zod
- **Pagos (semana 6+):** Stripe
- **AI calls:** Anthropic SDK (solo donde aporte: scoring, summaries)
- **Hosting:** Vercel

## Estructura

```
src/
├── app/                    # App Router de Next.js 15
│   ├── layout.tsx
│   ├── page.tsx            # Landing pública
│   └── globals.css         # Tailwind + shadcn theme
├── components/
│   └── ui/                 # shadcn/ui (button, etc.)
├── lib/
│   ├── db/
│   │   ├── index.ts        # Drizzle client (postgres-js)
│   │   └── schema.ts       # Tablas Drizzle
│   ├── supabase/
│   │   ├── client.ts       # Cliente browser (Client Components)
│   │   └── server.ts       # Cliente servidor (Server Components, Server Actions)
│   └── utils.ts            # cn() helper de shadcn
drizzle.config.ts           # Config para drizzle-kit
.env.example                # Plantilla de variables (copiar a .env.local)
```

## Reglas del proyecto

### Server vs Client Components

- **Server Components por defecto.** Solo añadir `'use client'` cuando la pieza necesite estado, eventos del navegador o hooks de cliente.
- **Para consultar la DB:** hacerlo desde Server Components o Server Actions, nunca desde Client Components.
- **Para mutaciones:** Server Actions (`'use server'`), no API routes salvo webhooks externos (Stripe).

### Database

- Cualquier cambio de schema → editar `src/lib/db/schema.ts` → `npx drizzle-kit generate` → revisar SQL → `npx drizzle-kit migrate`.
- Nunca escribir SQL crudo en componentes; usar el query builder de Drizzle.
- `profiles.id` siempre = `auth.users.id` de Supabase (relación 1:1).

### Auth

- Cliente browser: `import { createClient } from '@/lib/supabase/client'`.
- Cliente servidor: `import { createClient } from '@/lib/supabase/server'` + `await createClient()`.
- Middleware de refresh de sesión se añadirá cuando se implemente login (semana 2-3).

### Estilos

- Tailwind v4 (sintaxis nueva, `@import "tailwindcss"`).
- Componentes UI: shadcn `npx shadcn@latest add <component>`.
- Nada de CSS-in-JS, nada de styled-components.

### Nomenclatura

- Componentes: `PascalCase.tsx`.
- Rutas (`app/`): `kebab-case/page.tsx`.
- Tablas en DB: `snake_case`.
- Variables de entorno: `SCREAMING_SNAKE_CASE`.

## Variables de entorno

Ver `.env.example`. Copiar a `.env.local` y rellenar. Requeridas para arrancar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` (cadena de conexión Postgres de Supabase, formato `postgresql://...`)

## Comandos

```bash
npm run dev                 # Dev server
npm run build               # Build producción
npm run lint                # ESLint
npx drizzle-kit generate    # Generar migración SQL desde schema.ts
npx drizzle-kit migrate     # Aplicar migraciones a la DB
npx drizzle-kit studio      # UI para explorar la DB
npx shadcn@latest add <c>   # Añadir componente shadcn
```

## Build-in-public

Este repo se construye en público durante 8 semanas. El setup multi-agente que escribe este código vive en su propio repo: [agentdeck-claude-setup](https://github.com/devsdm99/agentdeck-claude-setup). Cada cambio significativo se commitea con mensaje útil para el post de la semana correspondiente.
