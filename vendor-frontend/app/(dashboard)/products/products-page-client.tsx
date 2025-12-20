'use client';

import { useState } from 'react';
import { Product, productsApi } from '@/lib/api';
import { ProductsTable } from './products-table';
import { TableSkeleton } from '@/components/table-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { File, PlusCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ProductsPageClientProps {
  initialProducts: Product[];
  initialTotal: number;
  initialOffset: number | null;
  initialSearch: string;
  initialStatus?: 'active' | 'inactive' | 'archived';
}

export function ProductsPageClient({
  initialProducts,
  initialTotal,
  initialOffset,
  initialSearch,
  initialStatus,
}: ProductsPageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [offset, setOffset] = useState(initialOffset);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStatus, setCurrentStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>(
    initialStatus || 'all'
  );

  const handleRefresh = async (statusFilter?: 'active' | 'inactive' | 'archived') => {
    setIsLoading(true);
    try {
      const currentOffset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;
      const currentSearch = searchParams.get('q') || '';
      const filterStatus = statusFilter || (currentStatus !== 'all' ? currentStatus : undefined);
      
      const result = await productsApi.getAll({
        search: currentSearch,
        offset: currentOffset,
        status: filterStatus,
        limit: 5,
      });
      
      setProducts(result.products);
      setTotal(result.total);
      setOffset(result.offset);
    } catch (error) {
      console.error('Error al actualizar productos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value as 'all' | 'active' | 'inactive' | 'archived';
    setCurrentStatus(newStatus);
    
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus !== 'all') {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    params.delete('offset'); // Reset offset when changing status
    
    router.push(`/products?${params.toString()}`);
    handleRefresh(newStatus !== 'all' ? newStatus : undefined);
  };

  if (isLoading) {
    return <TableSkeleton columns={7} rows={5} />;
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4">
      <Tabs defaultValue={currentStatus} value={currentStatus} onValueChange={handleStatusChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="inactive">Inactivos</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archivados
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
            <Button asChild size="sm" className="h-8 gap-1">
              <Link href="/products/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Agregar Producto
                </span>
              </Link>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <ProductsTable
            products={products}
            total={total}
            offset={offset}
            onRefresh={() => handleRefresh()}
          />
        </TabsContent>
        <TabsContent value="active">
          <ProductsTable
            products={products}
            total={total}
            offset={offset}
            onRefresh={() => handleRefresh('active')}
          />
        </TabsContent>
        <TabsContent value="inactive">
          <ProductsTable
            products={products}
            total={total}
            offset={offset}
            onRefresh={() => handleRefresh('inactive')}
          />
        </TabsContent>
        <TabsContent value="archived">
          <ProductsTable
            products={products}
            total={total}
            offset={offset}
            onRefresh={() => handleRefresh('archived')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

