-- Vendor Backend initial migration
-- Generates core tables for vendor domain and api keys.

-- Enums
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE "product_status" AS ENUM ('active', 'inactive', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE "order_status" AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
  END IF;
END $$;

-- API keys
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" serial PRIMARY KEY NOT NULL,
  "key_hash" text NOT NULL,
  "name" text NOT NULL,
  "scopes" jsonb,
  "rate_limit" integer DEFAULT 100,
  "expires_at" timestamp,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "last_used_at" timestamp,
  "is_active" text DEFAULT 'active',
  CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);

-- Products
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "image_url" text NOT NULL,
  "name" text NOT NULL,
  "status" "product_status" DEFAULT 'active' NOT NULL,
  "price" numeric(10, 2) NOT NULL,
  "stock" integer DEFAULT 0 NOT NULL,
  "available_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Customers
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "address" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Orders (simple order header for now)
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "customer_id" integer NOT NULL,
  "status" "order_status" DEFAULT 'pending' NOT NULL,
  "total" numeric(10, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_customer_id_customers_id_fk'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_customer_id_customers_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
      ON DELETE cascade;
  END IF;
END $$;

-- Indexes
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_name" ON "products" ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_status" ON "products" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_email" ON "customers" ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_customer_id" ON "orders" ("customer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" ("status");


