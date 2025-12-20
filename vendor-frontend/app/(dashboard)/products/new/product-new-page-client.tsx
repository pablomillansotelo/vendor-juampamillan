'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '../product-form';

export function ProductNewPageClient() {
  const router = useRouter();

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo producto</CardTitle>
          <CardDescription>Crea un producto para tu catálogo de ventas.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={null}
            onCancel={() => router.push('/products')}
            onSuccess={() => router.push('/products')}
          />
        </CardContent>
      </Card>
    </div>
  );
}


