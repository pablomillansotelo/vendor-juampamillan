-- Script SQL de referencia para crear las tablas del sistema Vendor
-- Este script es solo para referencia. El sistema usa migraciones automáticas (Drizzle).

-- Enums
CREATE TYPE IF NOT EXISTS product_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE IF NOT EXISTS order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scopes JSONB,
  rate_limit INTEGER DEFAULT 100,
  expires_at TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,
  is_active TEXT DEFAULT 'active'
);

-- Productos
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  name TEXT NOT NULL,
  status product_status NOT NULL DEFAULT 'active',
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Órdenes (encabezado simple)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


