-- Script SQL de referencia con datos de ejemplo (Vendor)

INSERT INTO products (image_url, name, status, price, stock, available_at)
VALUES
  ('https://placehold.co/600x400/png', 'Producto A', 'active', 199.99, 100, NOW()),
  ('https://placehold.co/600x400/png', 'Producto B', 'inactive', 79.50, 0, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO customers (name, email, phone, address)
VALUES
  ('Cliente Demo', 'cliente.demo@example.com', '555-555-5555', 'Dirección Demo')
ON CONFLICT DO NOTHING;

INSERT INTO orders (customer_id, status, total)
VALUES
  ((SELECT id FROM customers WHERE email = 'cliente.demo@example.com' LIMIT 1), 'pending', 199.99)
ON CONFLICT DO NOTHING;


