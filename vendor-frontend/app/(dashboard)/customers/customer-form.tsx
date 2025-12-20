'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormError } from '@/components/ui/form';
import { toast } from '@/lib/toast';
import { customerSchema, type CustomerFormData } from '@/lib/schemas/customer';
import { customersApi, type Customer, type CreateCustomerInput, type UpdateCustomerInput } from '@/lib/api';

interface CustomerFormProps {
  customer?: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (customer) {
        const payload: UpdateCustomerInput = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        };
        await customersApi.update(customer.id, payload);
        toast.success('Cliente actualizado', 'Los cambios se guardaron correctamente');
      } else {
        const payload: CreateCustomerInput = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        };
        await customersApi.create(payload);
        toast.success('Cliente creado', 'El cliente se creó correctamente');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      toast.error('Error al guardar cliente', error.message || 'No se pudo guardar el cliente');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField>
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...register('name')} placeholder="Nombre del cliente" aria-invalid={errors.name ? 'true' : 'false'} />
        {errors.name && <FormError>{errors.name.message}</FormError>}
      </FormField>

      <FormField>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" {...register('email')} placeholder="cliente@ejemplo.com" aria-invalid={errors.email ? 'true' : 'false'} />
        {errors.email && <FormError>{errors.email.message}</FormError>}
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...register('phone')} placeholder="555-123-4567" />
          {errors.phone && <FormError>{errors.phone.message}</FormError>}
        </FormField>

        <FormField>
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" {...register('address')} placeholder="Calle, número, ciudad" />
          {errors.address && <FormError>{errors.address.message}</FormError>}
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : customer ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}


