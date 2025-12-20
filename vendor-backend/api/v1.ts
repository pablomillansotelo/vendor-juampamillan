import { Elysia } from 'elysia'
// API Keys
import { apiKeys } from '../src/api-keys/router.js'
// Vendor
import { productsRouter } from '../src/vendor/products/router.js'
import { customersRouter } from '../src/vendor/customers/router.js'
import { ordersRouter } from '../src/vendor/orders/router.js'

/**
 * API v1 - Versión actual para sistema Vendor
 * Gestión de productos, clientes y órdenes
 * Nota: Los usuarios se gestionan en el backend de Permit
 */
export const v1Routes = new Elysia({ prefix: '/v1' })
    .use(apiKeys)
    .use(productsRouter)
    .use(customersRouter)
    .use(ordersRouter)

