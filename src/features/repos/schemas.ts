import { z } from 'zod';

export const createRepoInputSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'slug debe ser kebab-case'),
  description: z.string().max(500).optional(),
});

export type CreateRepoInput = z.infer<typeof createRepoInputSchema>;
