import { customersApi, type Customer } from '@/lib/api-server';
import { CustomersPageClient } from './customers-page-client';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  let initialCustomers: Customer[] = [];
  try {
    initialCustomers = await customersApi.getAll();
  } catch (error) {
    console.error('Error fetching customers:', error);
  }

  return <CustomersPageClient initialCustomers={initialCustomers} />;
}


