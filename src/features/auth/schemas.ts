import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type Credentials = z.infer<typeof credentialsSchema>;
