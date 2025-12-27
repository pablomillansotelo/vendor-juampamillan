import { redirect } from 'next/navigation';

/**
 * Los productos externos se gestionan en Inventory
 * Redirigir a la página de productos (solo lectura)
 */
export default function EditProductPage() {
  redirect('/products');
}

// Nota: ProductEditPageClient ya no se usa porque redirigimos en el servidor
