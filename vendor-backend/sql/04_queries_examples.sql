-- Queries de ejemplo (Vendor)

-- Productos activos
SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC;

-- Buscar productos por nombre
SELECT * FROM products WHERE name ILIKE '%prod%' ORDER BY created_at DESC;

-- Órdenes con nombre de cliente (join)
SELECT
  o.id,
  o.status,
  o.total,
  o.created_at,
  c.name AS customer_name,
  c.email AS customer_email
FROM orders o
JOIN customers c ON c.id = o.customer_id
ORDER BY o.created_at DESC;


