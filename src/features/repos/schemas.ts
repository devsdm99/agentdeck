import { z } from 'zod';

const slugRegex = /^[a-z0-9][a-z0-9-]*$/;

export const createRepoInputSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(slugRegex, 'slug debe ser kebab-case'),
  description: z.string().max(500).optional(),
});
export type CreateRepoInput = z.infer<typeof createRepoInputSchema>;

export const addRepoFromUrlInputSchema = z.object({
  url: z.string().url(),
  name: z.string().trim().min(1, 'El nombre no puede estar vacío').max(120),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug no puede estar vacío')
    .max(80)
    .regex(slugRegex, 'El slug solo puede contener minúsculas, números y guiones'),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
});
export type AddRepoFromUrlInput = z.infer<typeof addRepoFromUrlInputSchema>;
