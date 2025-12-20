-- Script SQL de referencia para crear índices (Vendor)

-- Productos
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Clientes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Órdenes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);


