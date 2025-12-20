/**
 * Seed de datos para Vendor Backend
 * Ejecutar con: bun run src/seed.ts
 *
 * Nota: este backend NO gestiona users/roles/RBAC (eso vive en Permit).
 * Aquí solo se generan datos de ejemplo de:
 * - productos
 * - clientes
 * - órdenes (simples)
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

const sqlClient = neon(process.env.DATABASE_URL!)
const db = drizzle(sqlClient, { schema })

async function seed() {
  console.log('🌱 Iniciando seed de Vendor...')

  try {
    console.log('📦 Creando productos...')
    await db
      .insert(schema.products)
      .values([
        {
          imageUrl: 'https://placehold.co/600x400/png',
          name: 'Producto A',
          status: 'active',
          price: '199.99',
          stock: 100,
          availableAt: new Date(),
          updatedAt: new Date(),
        },
        {
          imageUrl: 'https://placehold.co/600x400/png',
          name: 'Producto B',
          status: 'inactive',
          price: '79.50',
          stock: 0,
          availableAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      .onConflictDoNothing()

    console.log('📦 Creando clientes...')
    const [customer1] = await db
      .insert(schema.customers)
      .values({
        name: 'Cliente Demo',
        email: 'cliente.demo@example.com',
        phone: '555-555-5555',
        address: 'Dirección Demo',
        updatedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning()

    const customerFinal =
      customer1 || (await db.select().from(schema.customers).limit(1))[0]

    if (customerFinal) {
      console.log('📦 Creando orden de ejemplo...')
      await db
        .insert(schema.orders)
        .values({
          customerId: customerFinal.id,
          status: 'pending',
          total: '199.99',
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
    }

    console.log('✅ Seed completado')
  } catch (error: any) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  }
}

seed()


