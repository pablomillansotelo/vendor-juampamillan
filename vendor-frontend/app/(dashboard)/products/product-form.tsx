'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormError } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { productSchema, type ProductFormData } from '@/lib/schemas/product';
import { Product, productsApi, CreateProductInput, UpdateProductInput } from '@/lib/api';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      imageUrl: product?.imageUrl || 'https://placehold.co/600x400/png',
      status: product?.status || 'active',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      availableAt: typeof product?.availableAt === 'string' ? product.availableAt : undefined,
    },
  });

  const status = watch('status');

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (product) {
        const updateData: UpdateProductInput = {
          name: data.name,
          imageUrl: data.imageUrl,
          status: data.status,
          price: data.price,
          stock: data.stock,
          availableAt: data.availableAt,
        };
        await productsApi.update(product.id, updateData);
        toast.success('Producto actualizado', 'Los cambios se guardaron correctamente');
      } else {
        const createData: CreateProductInput = {
          name: data.name,
          imageUrl: data.imageUrl,
          status: data.status,
          price: data.price,
          stock: data.stock,
          availableAt: data.availableAt || new Date().toISOString(),
        };
        await productsApi.create(createData);
        toast.success('Producto creado', 'El producto se creó correctamente');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      toast.error('Error al guardar producto', error.message || 'No se pudo guardar el producto');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField>
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...register('name')} placeholder="Nombre del producto" aria-invalid={errors.name ? 'true' : 'false'} />
        {errors.name && <FormError>{errors.name.message}</FormError>}
      </FormField>

      <FormField>
        <Label htmlFor="imageUrl">Imagen (URL) *</Label>
        <Input id="imageUrl" {...register('imageUrl')} placeholder="https://..." aria-invalid={errors.imageUrl ? 'true' : 'false'} />
        {errors.imageUrl && <FormError>{errors.imageUrl.message}</FormError>}
      </FormField>

      <FormField>
        <Label>Estado *</Label>
        <Select value={status} onValueChange={(v) => setValue('status', v as any, { shouldValidate: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
            <SelectItem value="archived">Archivado</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && <FormError>{errors.status.message}</FormError>}
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="price">Precio *</Label>
          <Input id="price" type="number" step="0.01" {...register('price')} aria-invalid={errors.price ? 'true' : 'false'} />
          {errors.price && <FormError>{errors.price.message}</FormError>}
        </FormField>

        <FormField>
          <Label htmlFor="stock">Stock *</Label>
          <Input id="stock" type="number" step="1" {...register('stock')} aria-invalid={errors.stock ? 'true' : 'false'} />
          {errors.stock && <FormError>{errors.stock.message}</FormError>}
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}


