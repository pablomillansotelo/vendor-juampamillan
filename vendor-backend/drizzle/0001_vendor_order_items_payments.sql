-- Vendor Backend migration 0001
-- Adds order_items, payment_records and order_status_events for real orders MVP.

-- Enums
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE "payment_method" AS ENUM ('bank_transfer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE "payment_status" AS ENUM ('pending', 'confirmed');
  END IF;
END $$;

-- Order items
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "product_id" integer,
  "product_name" text NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price_base" numeric(10, 2) NOT NULL,
  "unit_price_final" numeric(10, 2) NOT NULL,
  "discount_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
  "discount_percent" numeric(5, 2) DEFAULT 0 NOT NULL,
  "line_total" numeric(10, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'order_items_order_id_orders_id_fk'
  ) THEN
    ALTER TABLE "order_items"
      ADD CONSTRAINT "order_items_order_id_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'order_items_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "order_items"
      ADD CONSTRAINT "order_items_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE set null;
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items" ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_product_id" ON "order_items" ("product_id");

-- Payment records
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "method" "payment_method" DEFAULT 'bank_transfer' NOT NULL,
  "status" "payment_status" DEFAULT 'pending' NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "reference" text,
  "proof_url" text,
  "notes" text,
  "paid_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payment_records_order_id_orders_id_fk'
  ) THEN
    ALTER TABLE "payment_records"
      ADD CONSTRAINT "payment_records_order_id_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE cascade;
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_records_order_id" ON "payment_records" ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_records_status" ON "payment_records" ("status");

-- Order status events
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_status_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "from_status" "order_status",
  "to_status" "order_status" NOT NULL,
  "reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'order_status_events_order_id_orders_id_fk'
  ) THEN
    ALTER TABLE "order_status_events"
      ADD CONSTRAINT "order_status_events_order_id_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE cascade;
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_status_events_order_id" ON "order_status_events" ("order_id");


