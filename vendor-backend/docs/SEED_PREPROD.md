# Seed preprod (Vendor Backend)

Este documento describe cómo generar **datos realistas** para un ambiente de **preproducción** sin depender de levantar otros microservicios.

## Script

- Archivo: `src/seed-preprod.ts`
- Comando:

```bash
bun run db:seed:preprod
```

## Variables de entorno

Requeridas:

- `DATABASE_URL`

Opcionales (recomendadas):

- `SEED_TAG` (default: `preprod`): etiqueta de idempotencia. Cambia el dataset por ambiente.
- `SEED_RANDOM_SEED` (default: `vendor-preprod`): hace el seed determinístico.
- `SEED_API_KEY`: si lo defines, el script crea (si no existe) una api key con scopes `['*']` y te imprime el valor para usarla como `X-API-Key`.

Control de volumen:

- `SEED_PRODUCTS` (default: `60`)
- `SEED_CUSTOMERS` (default: `40`)
- `SEED_ORDERS` (default: `120`)
- `SEED_PAYMENTS_RATIO` (default: `0.55`)

Ejemplo recomendado (preprod):

```bash
export DATABASE_URL="..."
export SEED_TAG="preprod-2025w51"
export SEED_RANDOM_SEED="vendor-preprod"
export SEED_API_KEY="pk_preprod_vendor_2025w51"
export SEED_PRODUCTS=80
export SEED_CUSTOMERS=60
export SEED_ORDERS=200
export SEED_PAYMENTS_RATIO=0.6

bun run db:seed:preprod
```

## Idempotencia (re-ejecutable)

Como `customers.email` y `products.name` no tienen constraint `unique`, el script aplica idempotencia así:

- **Customers**: `getOrCreate` por `email`.
- **Products**: `getOrCreate` por `name`.
- **Orders**: se marca un evento de status con `reason="seed:<tag>:order:<n>:created"`. Si existe, esa orden se considera ya sembrada y se omite.
- **Payments**: `reference="seed:<tag>:payment:seed:<tag>:order:<n>"` para evitar duplicar pagos.

Esto permite correr el seed múltiples veces sin duplicar órdenes/pagos del mismo `SEED_TAG`.


