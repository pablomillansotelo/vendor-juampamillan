'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Los productos externos se gestionan en Inventory
 * Este componente redirige automáticamente
 */
export function ProductEditPageClient() {
  const router = useRouter();

  useEffect(() => {
    router.push('/products');
  }, [router]);

  return null;
}


