'use client';

import { useMemo, useState } from 'react';
import { Customer, customersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSearch } from '@/components/table-search';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { CustomerForm } from './customer-form';

interface CustomersPageClientProps {
  initialCustomers: Customer[];
}

export function CustomersPageClient({ initialCustomers }: CustomersPageClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!search) return customers;
    const term = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageSliceStart = (currentPage - 1) * pageSize;
  const pageSliceEnd = pageSliceStart + pageSize;
  const paginated = filtered.slice(pageSliceStart, pageSliceEnd);

  const handleRefresh = async () => {
    try {
      const data = await customersApi.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error al refrescar clientes:', error);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await customersApi.delete(id);
      toast.success('Cliente eliminado', 'El cliente se eliminó correctamente');
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setPage(1);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error('Error al eliminar cliente');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Gestiona tu cartera de clientes.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>Nuevo cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
                <DialogDescription>
                  {editingCustomer ? 'Actualiza la información del cliente.' : 'Completa los datos para crear un cliente.'}
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                customer={editingCustomer}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  handleRefresh();
                }}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <TableSearch
              placeholder="Buscar por nombre, email o teléfono..."
              initialValue={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>
              Clientes: <strong>{filtered.length}</strong>
            </span>
            <span>
              Página {currentPage} de {totalPages}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="w-[100px]">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron clientes. Crea uno nuevo para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || <Badge variant="outline">Sin teléfono</Badge>}</TableCell>
                    <TableCell>{customer.address || <Badge variant="outline">Sin dirección</Badge>}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                        Editar
                      </Button>
                      <DeleteConfirmDialog
                        title="¿Eliminar cliente?"
                        description={`¿Seguro que deseas eliminar a "${customer.name}"? Esta acción no se puede deshacer.`}
                        onConfirm={() => handleDelete(customer.id)}
                        itemName={customer.name}
                        isLoading={deletingId === customer.id}
                        trigger={
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Eliminar
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
              <div>
                Mostrando{' '}
                <strong>
                  {filtered.length === 0 ? 0 : pageSliceStart + 1}-{Math.min(pageSliceEnd, filtered.length)}
                </strong>{' '}
                de <strong>{filtered.length}</strong>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


