import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  imageUrl: z.string().url('Debe ser una URL válida'),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  stock: z.coerce.number().int('Stock debe ser entero').min(0, 'Stock no puede ser negativo'),
  availableAt: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;


