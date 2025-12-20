# Sistema de Migraciones y Seed (Vendor Backend)

Este proyecto usa **Drizzle ORM** como única fuente de verdad para la estructura de la base de datos.

## Arquitectura

```
src/**/schema.ts (Schemas)
    ↓
src/schema.ts (Exporta todos los schemas)
    ↓
drizzle/ (Migraciones SQL)
    ↓
PostgreSQL
```

## Comandos

### Generar migraciones

```bash
bun run db:generate
```

### Ejecutar migraciones

```bash
bun run db:migrate
```

### Push directo (desarrollo)

```bash
bun run db:push
```

### Seed (datos de ejemplo)

```bash
bun run db:seed
```

El seed crea:
- productos demo
- cliente demo
- una orden demo

## Nota de dominio

- **Users/RBAC/Notificaciones/Auditoría** viven en **Permit**.
- Este backend solo gestiona **productos, clientes, órdenes** y **api keys**.


