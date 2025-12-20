import { pgTable, serial, integer, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { customers } from "../customers/schema";
import { products } from "../products/schema";

/**
 * Enum para el estado de la orden
 */
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

/**
 * Schema de órdenes
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: 'cascade' }),
  status: orderStatusEnum("status").notNull().default("pending"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Líneas de orden (order items)
 * Nota: guardamos snapshot de nombre/precios para que la orden no dependa del cambio de catálogo.
 */
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer("product_id").references(() => products.id, { onDelete: 'set null' }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceBase: numeric("unit_price_base", { precision: 10, scale: 2 }).notNull(),
  unitPriceFinal: numeric("unit_price_final", { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default('0'),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Pagos manuales (transferencias, etc.)
 */
export const paymentMethodEnum = pgEnum('payment_method', ['bank_transfer']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'confirmed']);

export const paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  method: paymentMethodEnum("method").notNull().default('bank_transfer'),
  status: paymentStatusEnum("status").notNull().default('pending'),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reference: text("reference"),
  proofUrl: text("proof_url"),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Timeline de cambios de status
 */
export const orderStatusEvents = pgTable("order_status_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: orderStatusEnum("from_status"),
  toStatus: orderStatusEnum("to_status").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Relaciones
 */
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(paymentRecords),
  statusEvents: many(orderStatusEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentRecordsRelations = relations(paymentRecords, ({ one }) => ({
  order: one(orders, {
    fields: [paymentRecords.orderId],
    references: [orders.id],
  }),
}));

export const orderStatusEventsRelations = relations(orderStatusEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusEvents.orderId],
    references: [orders.id],
  }),
}));

