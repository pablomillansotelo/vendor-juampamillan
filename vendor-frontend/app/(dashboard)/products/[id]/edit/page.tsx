import { productsApi, type Product } from '@/lib/api-server';
import { ProductEditPageClient } from './product-edit-page-client';

export const dynamic = 'force-dynamic';

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number(params.id);

  const product: Product = await productsApi.getById(id);

  return <ProductEditPageClient product={product} />;
}


