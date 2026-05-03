'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addRepoFromUrlAction,
  type AddRepoFromUrlState,
} from '@/features/repos/actions';

const SLUG_INVALID_CHARS = /[^a-z0-9]+/g;
const SLUG_TRIM_DASHES = /^-+|-+$/g;

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(SLUG_INVALID_CHARS, '-')
    .replace(SLUG_TRIM_DASHES, '')
    .slice(0, 80);
}

const GITHUB_URL_RE =
  /^https?:\/\/github\.com\/([^/]+)\/([^/?#]+?)(?:\.git)?\/?(?:\?|#|$)/i;

function deriveFromUrl(url: string): { name: string; slug: string } | null {
  const match = url.trim().match(GITHUB_URL_RE);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2];
  return {
    name: repo,
    slug: toSlug(`${owner}-${repo}`),
  };
}

export function AddRepoForm(): React.ReactElement {
  const [state, formAction, pending] = useActionState<
    AddRepoFromUrlState | undefined,
    FormData
  >(addRepoFromUrlAction, undefined);

  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    const derived = deriveFromUrl(url);
    if (!derived) return;
    if (!nameTouched) setName(derived.name);
    if (!slugTouched) setSlug(derived.slug);
  }, [url, nameTouched, slugTouched]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        label="URL del repo en GitHub"
        htmlFor="url"
        hint="Por ahora solo URLs públicas. https://github.com/owner/repo"
        error={state?.fieldErrors?.url}
      >
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://github.com/devsdm99/agentdeck"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={Boolean(state?.fieldErrors?.url)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nombre"
          htmlFor="name"
          hint="Cómo se mostrará en tu dashboard."
          error={state?.fieldErrors?.name}
        >
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameTouched(true);
            }}
            aria-invalid={Boolean(state?.fieldErrors?.name)}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          hint="Usado en la URL del dashboard."
          error={state?.fieldErrors?.slug}
        >
          <Input
            id="slug"
            name="slug"
            required
            maxLength={80}
            pattern="^[a-z0-9][a-z0-9-]*$"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            aria-invalid={Boolean(state?.fieldErrors?.slug)}
            className="font-mono"
          />
        </Field>
      </div>

      <Field
        label="Descripción (opcional)"
        htmlFor="description"
        hint="Para acordarte de qué hay en este repo."
        error={state?.fieldErrors?.description}
      >
        <Input
          id="description"
          name="description"
          maxLength={500}
          aria-invalid={Boolean(state?.fieldErrors?.description)}
        />
      </Field>

      {state?.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Escaneando…' : 'Conectar y escanear'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
