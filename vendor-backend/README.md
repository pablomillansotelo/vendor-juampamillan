# Vendor Backend - Sistema de Gestión de Productos y Ventas

Backend completo para gestión de productos, clientes, órdenes y usuarios. Construido con Elysia.js, Drizzle ORM, Neon PostgreSQL y desplegado en Vercel.

## 🚀 Características

- ✅ CRUD completo de productos con búsqueda y filtros
- ✅ CRUD completo de clientes
- ✅ CRUD completo de órdenes con estados
- ✅ Nota: notificaciones y usuarios viven en Permit (servicio adicional)
- ✅ Gestión de API keys
- ✅ Migraciones automáticas de base de datos
- ✅ Documentación Swagger integrada
- ✅ Optimizado para Vercel (una sola función serverless)

## 📁 Estructura del Proyecto

```
api/
  └── index.ts          # Punto de entrada principal (única función serverless)
  └── v1.ts             # Rutas de la API v1

src/
  ├── db.ts             # Configuración de la base de datos
  ├── migrations.ts     # Sistema de migraciones automáticas
  ├── api-keys/         # Gestión de API keys
  └── vendor/           # Módulos de vendor
      ├── products/     # Gestión de productos
      ├── customers/   # Gestión de clientes
      └── orders/       # Gestión de órdenes

sql/                    # Scripts SQL de referencia
docs/                   # Documentación completa
```

## 🛠️ Tecnologías

- **Elysia.js** - Framework web TypeScript
- **Drizzle ORM** - ORM para TypeScript
- **Neon PostgreSQL** - Base de datos serverless
- **Vercel** - Plataforma de despliegue
- **Bun** - Runtime y gestor de paquetes

## 📦 Instalación

```bash
# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu DATABASE_URL
```

## 🚀 Desarrollo

```bash
# Ejecutar en modo desarrollo
bun run dev

# La API estará disponible en http://localhost:8000
# La documentación Swagger en http://localhost:8000/swagger
```

## 📚 Documentación

- **Documentación Swagger**: Disponible en `/swagger` cuando la app está corriendo
- **Plan de Limpieza**: Ver [CLEANUP_PLAN.md](CLEANUP_PLAN.md)

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` con:

```env
DATABASE_URL=postgresql://user:password@host/database
API_KEY=tu-api-key-secreta-aqui
```

Para Neon, la URL es similar a:
```env
DATABASE_URL=postgresql://user:password@projectname.neon.tech/dbname?sslmode=require
```

**Importante:** La `API_KEY` debe coincidir con `VENDOR_API_KEY` o `PERMIT_API_KEY` en el frontend. Esta clave se usa para autenticar las requests del frontend al backend.

### Migraciones

El sistema ejecuta migraciones automáticamente al iniciar. Las tablas se crean automáticamente si no existen.

Para ejecutar migraciones manualmente con Drizzle Kit:

```bash
# Generar migraciones
bun drizzle-kit generate

# Ejecutar migraciones
bun drizzle-kit migrate

# Abrir Drizzle Studio
bun drizzle-kit studio
```

## 🌐 Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Configura la variable de entorno `DATABASE_URL`
3. Vercel detectará automáticamente la configuración

**Nota:** El proyecto está optimizado para usar una sola función serverless, cumpliendo con el límite del plan Hobby de Vercel.

## 📖 Endpoints Principales

**Nota:** Los usuarios se gestionan en el backend de Permit (`/v1/users`). Este backend solo maneja productos, clientes y órdenes.

### Productos
- `GET /v1/products` - Listar productos (con filtros y paginación)
- `GET /v1/products/:id` - Obtener producto por ID
- `POST /v1/products` - Crear producto
- `PUT /v1/products/:id` - Actualizar producto
- `DELETE /v1/products/:id` - Eliminar producto

### Clientes
- `GET /v1/customers` - Listar clientes
- `GET /v1/customers/:id` - Obtener cliente por ID
- `POST /v1/customers` - Crear cliente
- `PUT /v1/customers/:id` - Actualizar cliente
- `DELETE /v1/customers/:id` - Eliminar cliente

### Órdenes
- `GET /v1/orders` - Listar órdenes
- `GET /v1/orders/:id` - Obtener orden por ID
- `POST /v1/orders` - Crear orden
- `PUT /v1/orders/:id` - Actualizar orden
- `DELETE /v1/orders/:id` - Eliminar orden

### Notificaciones
- Se gestionan en el backend de Permit.

Ver la documentación Swagger en `/swagger` para todos los endpoints con detalles completos.

## 🗄️ Base de Datos

El sistema crea automáticamente las siguientes tablas:

- `products` - Productos disponibles
- `customers` - Clientes
- `orders` - Órdenes de compra
- `notifications` - Notificaciones del sistema
- `api_keys` - API keys para autenticación

**Nota:** Los usuarios se gestionan en el backend de Permit, por lo que la tabla `users` no existe en este backend.

Ver [sql/](sql/) para scripts SQL de referencia.

## 📝 Licencia

Este proyecto es privado.
