/**
 * Archivo central que exporta todos los schemas
 * Este archivo es usado por Drizzle Kit para generar migraciones
 * Única fuente de verdad para la estructura de la base de datos
 * 
 * Nota: Los usuarios se gestionan en el backend de Permit
 */

// API Keys Schema
export * from './api-keys/schema'

// Vendor Schemas
export * from './vendor/products/schema'
export * from './vendor/customers/schema'
export * from './vendor/orders/schema'

