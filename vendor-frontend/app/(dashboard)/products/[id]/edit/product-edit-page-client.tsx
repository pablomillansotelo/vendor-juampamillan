'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '../../product-form';
import type { Product } from '@/lib/api';

export function ProductEditPageClient({ product }: { product: Product }) {
  const router = useRouter();

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar producto</CardTitle>
          <CardDescription>Actualiza la información del producto.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={product}
            onCancel={() => router.push('/products')}
            onSuccess={() => router.push('/products')}
          />
        </CardContent>
      </Card>
    </div>
  );
}


