import { z } from 'zod';

export const scanFromUrlInputSchema = z.object({
  repoId: z.string().uuid(),
  url: z.string().url(),
});

export type ScanFromUrlInput = z.infer<typeof scanFromUrlInputSchema>;

export const scanFromZipMetaSchema = z.object({
  repoId: z.string().uuid(),
});

export type ScanFromZipMeta = z.infer<typeof scanFromZipMetaSchema>;
