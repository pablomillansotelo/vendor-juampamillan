# Plan de Limpieza y Refactorización - Vendor Backend

## 📋 Resumen

Este documento describe el plan para transformar `vendor-backend` (copia de `permit-backend`) en un backend específico para el sistema **Vendor** (gestión de productos y ventas).

## 🎯 Objetivo

Eliminar todas las funcionalidades relacionadas con **Permit** (RBAC, HRMS) y mantener/crear solo lo necesario para **Vendor**:
- ✅ Usuarios del sistema (sin roles/permisos)
- ✅ Notificaciones
- ✅ API Keys
- ✅ Productos
- ✅ Clientes
- ✅ Órdenes

## 🗑️ Módulos a Eliminar

### RBAC (Role-Based Access Control)
- ❌ `src/roles/` - Gestión de roles
- ❌ `src/resources/` - Gestión de recursos
- ❌ `src/permissions/` - Gestión de permisos
- ❌ `src/role-permissions/` - Asociación roles-permisos
- ❌ `src/user-roles/` - Asignación de roles a usuarios

### HRMS (Human Resources Management System)
- ❌ `src/hr/departments/` - Departamentos
- ❌ `src/hr/positions/` - Puestos de trabajo
- ❌ `src/hr/org-chart/` - Organigrama
- ❌ `src/hr/employment-types/` - Tipos de empleo

### Ausentismos
- ❌ `src/absences/leave-types/` - Tipos de ausencia
- ❌ `src/absences/leave-requests/` - Solicitudes de ausencia
- ❌ `src/absences/leave-balances/` - Balances de ausencia

### Performance
- ❌ `src/performance/` - Evaluaciones de desempeño

### Auditoría
- ❌ `src/audit/` - Logs de auditoría

## ✅ Módulos a Mantener

- ✅ `src/users/` - Usuarios del sistema (limpiar campos HR)
- ✅ `src/notifications/` - Sistema de notificaciones
- ✅ `src/api-keys/` - Gestión de API keys
- ✅ `src/middleware/` - CORS y rate limiting
- ✅ `src/db.ts` - Configuración de base de datos
- ✅ `src/migrations.ts` - Sistema de migraciones

## 🆕 Módulos a Crear

### Vendor
- 🆕 `src/vendor/products/` - Gestión de productos
  - `schema.ts` - Schema de base de datos
  - `router.ts` - Rutas API
  - `service.ts` - Lógica de negocio
  - `model.ts` - Modelo de datos (opcional)

- 🆕 `src/vendor/customers/` - Gestión de clientes
  - `schema.ts` - Schema de base de datos
  - `router.ts` - Rutas API
  - `service.ts` - Lógica de negocio

- 🆕 `src/vendor/orders/` - Gestión de órdenes
  - `schema.ts` - Schema de base de datos
  - `router.ts` - Rutas API
  - `service.ts` - Lógica de negocio

## 📝 Cambios en Schemas

### Users Schema
**Eliminar campos HR:**
- `employeeId`
- `hireDate`
- `positionId`
- `departmentId`
- `managerId`
- `employmentType`
- `status` (o simplificar)
- `phone` (mantener si es útil)
- `address` (mantener si es útil)
- `birthDate`
- `emergencyContact`
- `salary`

**Mantener:**
- `id`
- `name`
- `email`
- `createdAt`
- `updatedAt` (agregar si no existe)

## 🔄 Cambios en Rutas

### api/v1.ts
**Eliminar:**
- `roles`
- `resources`
- `permissions`
- `rolePermissions`
- `userRoles`
- `departments`
- `positionsRouter`
- `orgChart`
- `leaveTypes`
- `leaveRequests`
- `performance`
- `audit`
- Endpoint `/available` (depende de resources/permissions)

**Mantener:**
- `users`
- `notifications`
- `apiKeys`

**Agregar:**
- `vendor/products`
- `vendor/customers`
- `vendor/orders`

## 📚 Actualizar Documentación

- Actualizar `README.md` con descripción de Vendor
- Actualizar tags de Swagger
- Actualizar descripción de la API
- Limpiar scripts SQL de referencia

## 🗄️ Migraciones

- Crear nueva migración para eliminar tablas no usadas
- Crear migración para limpiar schema de users
- Crear migración para tablas de vendor (products, customers, orders)

## 📦 Estructura Final Esperada

```
src/
├── db.ts
├── migrations.ts
├── schema.ts
├── seed.ts
├── users/          # ✅ Mantener (limpiar)
├── notifications/  # ✅ Mantener
├── api-keys/       # ✅ Mantener
├── middleware/      # ✅ Mantener
└── vendor/         # 🆕 Crear
    ├── products/
    ├── customers/
    └── orders/
```

## ✅ Checklist de Implementación

- [ ] Eliminar módulos RBAC
- [ ] Eliminar módulos HRMS
- [ ] Eliminar módulos de ausentismos
- [ ] Eliminar módulos de performance
- [ ] Eliminar módulos de auditoría
- [ ] Limpiar schema de users
- [ ] Crear schema de products
- [ ] Crear schema de customers
- [ ] Crear schema de orders
- [ ] Crear routers de vendor
- [ ] Crear services de vendor
- [ ] Actualizar api/v1.ts
- [ ] Actualizar api/index.ts
- [ ] Actualizar src/schema.ts
- [ ] Generar migraciones
- [ ] Actualizar documentación
- [ ] Limpiar scripts SQL
- [ ] Probar endpoints

