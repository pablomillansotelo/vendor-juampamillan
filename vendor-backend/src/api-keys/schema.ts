import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  keyHash: text("key_hash").notNull().unique(), // Hash de la API key (nunca almacenar la key en texto plano)
  name: text("name").notNull(), // Nombre descriptivo de la API key
  scopes: jsonb("scopes"), // Array de scopes permitidos
  rateLimit: integer("rate_limit").default(100), // Límite de requests por minuto
  expiresAt: timestamp("expires_at"), // Fecha de expiración (opcional)
  createdBy: integer("created_by"), // ID del usuario que creó la key
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"), // Última vez que se usó
  isActive: text("is_active").default("active"), // active, inactive, revoked
});

