import { pgTable, serial, text, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";

/**
 * Enum para el estado del producto
 */
export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'archived']);

/**
 * Schema de productos
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  name: text("name").notNull(),
  status: productStatusEnum("status").notNull().default("active"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  availableAt: timestamp("available_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

