/**
 * Seed "preprod" para Vendor Backend (datos realistas y coherentes).
 *
 * Objetivos:
 * - Generar catálogo, clientes, órdenes con items, pagos y timeline.
 * - Ser RE-EJECUTABLE sin duplicar órdenes/pagos (idempotencia por "seed tags").
 * - No depende de otros microservicios (Finance/Inventory/etc).
 *
 * Uso:
 *   DATABASE_URL=... bun run src/seed-preprod.ts
 *
 * Variables:
 * - SEED_TAG (default: "preprod"): etiqueta para idempotencia (se recomienda algo como "preprod-2025w51")
 * - SEED_RANDOM_SEED (default: "vendor-preprod"): semilla para datos pseudo-aleatorios determinísticos
 * - SEED_PRODUCTS (default: 60)
 * - SEED_CUSTOMERS (default: 40)
 * - SEED_ORDERS (default: 120)
 * - SEED_PAYMENTS_RATIO (default: 0.55) -> % de órdenes con pago confirmado
 * - SEED_API_KEY (opcional): si lo defines, se crea (si no existe) una api_key con ese valor (se guarda hash)
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { and, eq, like, sql } from 'drizzle-orm'
import * as schema from './schema.js'
import { ApiKeysService } from './api-keys/service.js'

function envInt(name: string, fallback: number) {
  const v = process.env[name]
  if (!v) return fallback
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function envFloat(name: string, fallback: number) {
  const v = process.env[name]
  if (!v) return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function hashStringToU32(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

class PRNG {
  private state: number
  constructor(seed: number) {
    this.state = seed || 0x12345678
  }
  nextU32(): number {
    // xorshift32
    let x = this.state
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.state = x >>> 0
    return this.state
  }
  nextFloat(): number {
    return this.nextU32() / 0xffffffff
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.nextFloat() * arr.length)]!
  }
  int(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min
  }
  bool(probTrue: number): boolean {
    return this.nextFloat() < probTrue
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function moneyToDb(n: number): string {
  return round2(n).toFixed(2)
}

function daysAgo(rng: PRNG, maxDays: number): Date {
  const d = new Date()
  const days = rng.int(0, Math.max(0, maxDays))
  const minutes = rng.int(0, 60 * 24)
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCMinutes(d.getUTCMinutes() - minutes)
  return d
}

function normalizePlaceholdUrl(url: string): string {
  // placehold.co suele responder SVG por default; forzamos PNG para que next/image no lo bloquee.
  // Soportamos:
  // - https://placehold.co/600x400
  // - https://placehold.co/600x400?text=...
  // - https://placehold.co/600x400/png?text=... (ya ok)
  if (!url.startsWith('https://placehold.co/')) return url
  if (url.includes('/png')) return url
  // Insertar /png justo después del tamaño (primer segmento después del host)
  // Ej: https://placehold.co/600x400?text=Cafe -> https://placehold.co/600x400/png?text=Cafe
  return url.replace('https://placehold.co/600x400', 'https://placehold.co/600x400/png')
}

async function ensureApiKey(db: ReturnType<typeof drizzle>, tag: string) {
  const provided = process.env.SEED_API_KEY
  if (!provided) return

  const keyHash = ApiKeysService.hashApiKey(provided)
  await db
    .insert(schema.apiKeys)
    .values({
      keyHash,
      name: `preprod-seed:${tag}`,
      scopes: ['*'],
      rateLimit: 500,
      isActive: 'active',
      createdAt: new Date(),
    } as any)
    .onConflictDoNothing()

  console.log(`🔑 SEED_API_KEY registrada (si no existía). Úsala como X-API-Key: ${provided}`)
}

async function getOrCreateCustomer(db: ReturnType<typeof drizzle>, input: { name: string; email: string; phone?: string; address?: string }) {
  const existing = await db.select().from(schema.customers).where(eq(schema.customers.email, input.email)).limit(1)
  if (existing[0]) return existing[0]
  const [created] = await db
    .insert(schema.customers)
    .values({
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      updatedAt: new Date(),
    })
    .returning()
  return created!
}

async function getOrCreateProduct(db: ReturnType<typeof drizzle>, input: { name: string; imageUrl: string; status: 'active' | 'inactive' | 'archived'; price: number; stock: number }) {
  const desiredImageUrl = normalizePlaceholdUrl(input.imageUrl)
  const existing = await db.select().from(schema.products).where(eq(schema.products.name, input.name)).limit(1)
  if (existing[0]) {
    // Si ya existe con URL vieja (SVG), la normalizamos para no romper next/image.
    if (typeof existing[0].imageUrl === 'string' && existing[0].imageUrl.startsWith('https://placehold.co/') && !existing[0].imageUrl.includes('/png')) {
      const updated = await db
        .update(schema.products)
        .set({ imageUrl: normalizePlaceholdUrl(existing[0].imageUrl), updatedAt: new Date() } as any)
        .where(eq(schema.products.id, existing[0].id))
        .returning()
      return updated[0] || existing[0]
    }
    return existing[0]
  }
  const [created] = await db
    .insert(schema.products)
    .values({
      name: input.name,
      imageUrl: desiredImageUrl,
      status: input.status,
      price: moneyToDb(input.price),
      stock: input.stock,
      availableAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .returning()
  return created!
}

async function orderAlreadySeeded(db: ReturnType<typeof drizzle>, seedReason: string): Promise<boolean> {
  const found = await db
    .select({ id: schema.orderStatusEvents.id })
    .from(schema.orderStatusEvents)
    .where(eq(schema.orderStatusEvents.reason, seedReason))
    .limit(1)
  return Boolean(found[0])
}

async function main() {
  const tag = process.env.SEED_TAG || 'preprod'
  const seedString = process.env.SEED_RANDOM_SEED || 'vendor-preprod'
  const rng = new PRNG(hashStringToU32(`${seedString}:${tag}`))

  const productsCount = envInt('SEED_PRODUCTS', 60)
  const customersCount = envInt('SEED_CUSTOMERS', 40)
  const ordersCount = envInt('SEED_ORDERS', 120)
  const paymentsRatio = Math.min(1, Math.max(0, envFloat('SEED_PAYMENTS_RATIO', 0.55)))

  const sqlClient = neon(process.env.DATABASE_URL!)
  const db = drizzle(sqlClient, { schema })

  console.log(`🌱 Seed preprod Vendor (tag=${tag})`)
  console.log(`- products=${productsCount} customers=${customersCount} orders=${ordersCount} paymentsRatio=${paymentsRatio}`)

  await ensureApiKey(db, tag)

  // === Productos ===
  console.log('📦 Generando catálogo...')
  const families = ['Café', 'Chocolate', 'Té', 'Galletas', 'Snacks', 'Salsas', 'Especias', 'Cereales', 'Miel', 'Aceite']
  const sizes = ['250g', '500g', '1kg', '330ml', '500ml', '1L', '6-pack', '12-pack']
  const quality = ['Clásico', 'Premium', 'Orgánico', 'Artesanal', 'Reserva', 'Light']

  const productIds: number[] = []
  for (let i = 1; i <= productsCount; i++) {
    const fam = rng.pick(families)
    const q = rng.pick(quality)
    const sz = rng.pick(sizes)
    const name = `${fam} ${q} ${sz} #${i}`
    const status = rng.bool(0.92) ? 'active' : rng.bool(0.5) ? 'inactive' : 'archived'
    const base = rng.int(35, 420)
    const cents = rng.pick([0, 0.5, 0.99])
    const price = base + cents
    const stock = status === 'active' ? rng.int(0, 220) : rng.int(0, 10)
    const imageUrl = `https://placehold.co/600x400/png?text=${encodeURIComponent(fam)}`

    const p = await getOrCreateProduct(db, { name, imageUrl, status: status as any, price, stock })
    productIds.push(p.id)
  }

  // === Clientes ===
  console.log('👥 Generando clientes...')
  const cities = ['CDMX', 'GDL', 'MTY', 'Puebla', 'Querétaro', 'Mérida', 'Tijuana', 'León']
  const segments = ['Retail', 'Mayorista', 'Distribuidor', 'Restaurante', 'Cafetería']

  const customers: Array<{ id: number; name: string; email: string }> = []
  for (let i = 1; i <= customersCount; i++) {
    const seg = rng.pick(segments)
    const city = rng.pick(cities)
    const name = `${seg} ${city} #${i}`
    const email = `cliente.${tag}.${i}@example.com`
    const phone = `55${rng.int(10000000, 99999999)}`
    const address = `${rng.int(1, 200)} Calle ${rng.pick(['Reforma', 'Insurgentes', 'Juárez', 'Constituyentes', 'Morelos'])}, ${city}`

    const c = await getOrCreateCustomer(db, { name, email, phone, address })
    customers.push({ id: c.id, name: c.name, email: c.email })
  }

  // === Órdenes ===
  console.log('🧾 Generando órdenes con items/pagos...')
  const statuses: Array<'pending' | 'processing' | 'shipped' | 'delivered'> = ['pending', 'processing', 'shipped', 'delivered']

  let createdOrders = 0
  let skippedOrders = 0

  for (let i = 1; i <= ordersCount; i++) {
    const customer = rng.pick(customers)
    const orderKey = `seed:${tag}:order:${i}`
    const seedReason = `${orderKey}:created`

    if (await orderAlreadySeeded(db, seedReason)) {
      skippedOrders++
      continue
    }

    const createdAt = daysAgo(rng, 60)
    const updatedAt = new Date(createdAt.getTime() + rng.int(0, 72) * 60 * 60 * 1000)

    const status = rng.pick(statuses)
    const itemsCount = rng.int(1, 4)

    const pickedProducts = new Set<number>()
    const items: Array<{
      productId: number
      quantity: number
      unitPriceBase: number
      unitPriceFinal: number
      discountAmount: number
      discountPercent: number
      lineTotal: number
      productName: string
    }> = []

    // Cargar productos puntuales para armar snapshot coherente
    for (let j = 0; j < itemsCount; j++) {
      let pid = rng.pick(productIds)
      let guard = 0
      while (pickedProducts.has(pid) && guard++ < 10) pid = rng.pick(productIds)
      pickedProducts.add(pid)

      const [prod] = await db.select().from(schema.products).where(eq(schema.products.id, pid)).limit(1)
      if (!prod) continue

      const qty = rng.int(1, 8)
      const base = Number(prod.price) || rng.int(50, 250)
      const discountPercent = rng.bool(0.25) ? rng.pick([5, 10, 15]) : 0
      const discountAmount = discountPercent === 0 && rng.bool(0.1) ? rng.pick([10, 25, 50]) : 0

      const unitFinal = Math.max(1, base) // hoy no cambiamos precio final por lista; solo descuentos
      const raw = unitFinal * qty
      const discountFromPercent = (raw * discountPercent) / 100
      const lineTotal = Math.max(0, raw - discountAmount - discountFromPercent)

      items.push({
        productId: pid,
        productName: prod.name,
        quantity: qty,
        unitPriceBase: base,
        unitPriceFinal: unitFinal,
        discountAmount,
        discountPercent,
        lineTotal,
      })
    }

    const total = round2(items.reduce((sum, it) => sum + it.lineTotal, 0))

    const [order] = await db
      .insert(schema.orders)
      .values({
        customerId: customer.id,
        status,
        total: moneyToDb(total),
        createdAt,
        updatedAt,
      } as any)
      .returning()

    const orderId = order!.id

    if (items.length > 0) {
      await db.insert(schema.orderItems).values(
        items.map((it) => ({
          orderId,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitPriceBase: moneyToDb(it.unitPriceBase),
          unitPriceFinal: moneyToDb(it.unitPriceFinal),
          discountAmount: moneyToDb(it.discountAmount),
          discountPercent: it.discountPercent.toFixed(2),
          lineTotal: moneyToDb(it.lineTotal),
          createdAt,
        })) as any
      )
    }

    // Timeline: creamos una marca seed "única" para poder re-ejecutar sin duplicar.
    await db.insert(schema.orderStatusEvents).values([
      {
        orderId,
        fromStatus: null,
        toStatus: 'pending',
        reason: seedReason,
        createdAt,
      },
      // también un evento de negocio humano (para UI)
      {
        orderId,
        fromStatus: null,
        toStatus: 'pending',
        reason: 'order_created',
        createdAt,
      },
    ] as any)

    if (status !== 'pending') {
      // Progresión simple de status (para que el timeline tenga sentido)
      const chain: Array<'processing' | 'shipped' | 'delivered'> = ['processing', 'shipped', 'delivered']
      let prev: any = 'pending'
      for (const st of chain) {
        if (st === status || (status === 'processing' && st === 'processing') || (status === 'shipped' && (st === 'processing' || st === 'shipped')) || (status === 'delivered')) {
          const eventAt = new Date(createdAt.getTime() + rng.int(1, 72) * 60 * 60 * 1000)
          await db.insert(schema.orderStatusEvents).values({
            orderId,
            fromStatus: prev,
            toStatus: st,
            reason: `seed_progress:${tag}`,
            createdAt: eventAt,
          } as any)
          prev = st
          if (st === status) break
        }
      }
    }

    // Pago: % configurable como confirmado (transferencia)
    if (rng.bool(paymentsRatio)) {
      const paymentRef = `seed:${tag}:payment:${orderKey}`
      const existingPayment = await db
        .select({ id: schema.paymentRecords.id })
        .from(schema.paymentRecords)
        .where(and(eq(schema.paymentRecords.orderId, orderId), eq(schema.paymentRecords.reference, paymentRef)))
        .limit(1)

      if (!existingPayment[0]) {
        const paidAt = new Date(createdAt.getTime() + rng.int(1, 96) * 60 * 60 * 1000)
        await db.insert(schema.paymentRecords).values({
          orderId,
          method: 'bank_transfer',
          status: 'confirmed',
          amount: moneyToDb(total),
          reference: paymentRef,
          proofUrl: `https://example.com/proofs/${encodeURIComponent(orderKey)}.png`,
          notes: 'Pago registrado por vendedor (seed preprod)',
          paidAt,
          createdAt: paidAt,
        } as any)
      }
    }

    createdOrders++
  }

  const [{ count: ordersTotal }] = await db.select({ count: sql<number>`count(*)` }).from(schema.orders)
  const [{ count: customersTotal }] = await db.select({ count: sql<number>`count(*)` }).from(schema.customers)
  const [{ count: productsTotal }] = await db.select({ count: sql<number>`count(*)` }).from(schema.products)

  console.log('✅ Seed preprod completado')
  console.log(`- createdOrders=${createdOrders} skippedOrders=${skippedOrders}`)
  console.log(`- totals => products=${Number(productsTotal)} customers=${Number(customersTotal)} orders=${Number(ordersTotal)}`)
}

main().catch((e) => {
  console.error('❌ Seed preprod falló:', e)
  process.exit(1)
})


