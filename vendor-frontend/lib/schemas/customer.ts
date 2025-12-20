import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Debe ser un email válido'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;


