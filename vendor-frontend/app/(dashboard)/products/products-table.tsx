'use client';

import {
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  Table
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Product as ProductRow } from './product-row';
import { Product as ProductType, productsApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSearch } from '@/components/table-search';
import { useState, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';

interface ProductsTableProps {
  products: ProductType[];
  total: number;
  offset: number | null;
  onRefresh: () => void;
}

export function ProductsTable({
  products,
  total,
  offset,
  onRefresh,
}: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const productsPerPage = 5;
  const currentOffset = searchParams.get('offset') ? Number(searchParams.get('offset')) : productsPerPage;

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }
    params.delete('offset'); // Reset offset on search
    router.push(`/products?${params.toString()}`);
  }, [searchTerm, router, searchParams]);

  function prevPage() {
    const params = new URLSearchParams(searchParams.toString());
    const newOffset = Math.max(productsPerPage, currentOffset - productsPerPage);
    if (newOffset === productsPerPage) {
      params.delete('offset');
    } else {
      params.set('offset', newOffset.toString());
    }
    router.push(`/products?${params.toString()}`);
  }

  function nextPage() {
    if (offset === null) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', offset.toString());
    router.push(`/products?${params.toString()}`);
  }

  const startIndex = Math.max(0, currentOffset - productsPerPage);
  const endIndex = Math.min(currentOffset, total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos</CardTitle>
        <CardDescription>
          Gestiona tus productos y visualiza su rendimiento de ventas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <TableSearch
            placeholder="Buscar productos..."
            initialValue={searchTerm}
            onSearch={setSearchTerm}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Imagen</span>
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Precio</TableHead>
              <TableHead className="hidden md:table-cell">
                Stock
              </TableHead>
              <TableHead className="hidden md:table-cell">Disponible desde</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <ProductRow key={product.id} product={product} onRefresh={onRefresh} />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="flex items-center w-full justify-between">
          <div className="text-xs text-muted-foreground">
            Mostrando{' '}
            <strong>
              {total > 0 ? startIndex + 1 : 0}-{endIndex}
            </strong>{' '}
            de <strong>{total}</strong> productos
          </div>
          <div className="flex gap-2">
            <Button
              onClick={prevPage}
              variant="ghost"
              size="sm"
              disabled={currentOffset === productsPerPage}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              onClick={nextPage}
              variant="ghost"
              size="sm"
              disabled={offset === null}
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

