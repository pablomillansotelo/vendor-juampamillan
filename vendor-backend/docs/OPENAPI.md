# OpenAPI / Swagger (Vendor Backend)

La especificación OpenAPI se expone automáticamente vía Swagger cuando el backend está corriendo:

- `GET /swagger`

## Tags esperados

- `api-keys`
- `products`
- `customers`
- `orders`

## Nota

Este backend **no** incluye:
- users
- RBAC
- audit logs
- notifications

Esas capacidades viven en el backend de **Permit**.


