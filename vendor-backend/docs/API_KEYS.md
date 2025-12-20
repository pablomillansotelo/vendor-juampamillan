# Guía de API Keys - Sistema Permit

Esta guía explica cómo generar, configurar, rotar y manejar API keys de forma segura en el sistema Permit.

## 📋 Índice

1. [¿Qué es una API Key?](#qué-es-una-api-key)
2. [Generar una API Key Segura](#generar-una-api-key-segura)
3. [Configuración](#configuración)
4. [Rotación de API Keys](#rotación-de-api-keys)
5. [Qué hacer si se compromete](#qué-hacer-si-se-compromete)
6. [Buenas Prácticas](#buenas-prácticas)
7. [Troubleshooting](#troubleshooting)

---

## ¿Qué es una API Key?

Una API Key es un token secreto que autentica las solicitudes del frontend al backend. En el sistema Permit:

- **Frontend**: Usa `PERMIT_API_KEY` (solo en servidor, nunca expuesta al cliente)
- **Backend**: Usa `API_KEY` (debe coincidir con `PERMIT_API_KEY` del frontend)
- **Validación**: El backend valida la API key en cada request (excepto rutas públicas)

---

## Generar una API Key Segura

### Método 1: Usando Node.js/Bun

```bash
# Generar una API key aleatoria de 32 caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O con Bun
bun -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

### Método 2: Usando OpenSSL

```bash
openssl rand -hex 32
```

### Método 3: Usando un generador online (solo para desarrollo)

⚠️ **Advertencia**: Solo usa generadores online para desarrollo. Para producción, usa métodos locales.

### Ejemplo de API Key generada:

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Características de una buena API Key:**
- ✅ Mínimo 32 caracteres
- ✅ Aleatoria y no predecible
- ✅ Alfanumérica (letras y números)
- ✅ Única para cada entorno (desarrollo, staging, producción)

---

## Configuración

### Backend (`permit-backend/.env.local`)

```env
DATABASE_URL=postgresql://user:password@host/database
API_KEY=tu-api-key-secreta-aqui
```

### Frontend (`permit-frontend/.env.local`)

```env
# Server-side only (nunca se expone al cliente)
PERMIT_API_URL=http://localhost:8000
PERMIT_API_KEY=tu-api-key-secreta-aqui  # Debe coincidir con API_KEY del backend

# NextAuth
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
NEXTAUTH_SECRET=...
```

### ⚠️ Importante

1. **Nunca commitees** `.env.local` al repositorio
2. **Asegúrate** de que `PERMIT_API_KEY` (frontend) coincida con `API_KEY` (backend)
3. **Usa diferentes keys** para desarrollo, staging y producción

---

## Rotación de API Keys

La rotación periódica de API keys es una buena práctica de seguridad. Sigue estos pasos:

### Paso 1: Generar nueva API Key

```bash
# Generar nueva key
openssl rand -hex 32
```

### Paso 2: Actualizar Backend

1. Actualiza `permit-backend/.env.local`:
   ```env
   API_KEY=nueva-api-key-aqui
   ```

2. Reinicia el backend

### Paso 3: Actualizar Frontend

1. Actualiza `permit-frontend/.env.local`:
   ```env
   PERMIT_API_KEY=nueva-api-key-aqui
   ```

2. Reinicia el frontend

### Paso 4: Verificar

1. Verifica que las requests funcionen correctamente
2. Monitorea logs por errores de autenticación
3. Una vez confirmado, puedes eliminar la key antigua

### ⏱️ Frecuencia Recomendada

- **Desarrollo**: No es necesario rotar
- **Staging**: Cada 3-6 meses
- **Producción**: Cada 3-6 meses o después de un incidente de seguridad

---

## Qué hacer si se compromete

Si sospechas que tu API key ha sido comprometida:

### 1. Rotar inmediatamente

Sigue los pasos de [Rotación de API Keys](#rotación-de-api-keys) **inmediatamente**.

### 2. Revisar logs

```bash
# Revisar logs del backend para intentos de acceso no autorizados
# Buscar errores 401 (Unauthorized)
```

### 3. Auditar accesos

- Revisa qué datos pudieron haber sido accedidos
- Verifica si hubo cambios no autorizados
- Revisa logs de acceso a la base de datos

### 4. Notificar al equipo

Si es un incidente de producción, notifica al equipo de seguridad inmediatamente.

### 5. Documentar el incidente

Mantén un registro del incidente para análisis posterior.

---

## Buenas Prácticas

### ✅ Hacer

1. **Usar variables de entorno** para almacenar API keys
2. **Rotar periódicamente** (cada 3-6 meses)
3. **Usar diferentes keys** para cada entorno
4. **Validar en cada request** (ya implementado)
5. **Monitorear intentos fallidos** de autenticación
6. **Usar HTTPS** en producción
7. **Limitar acceso** a archivos `.env.local`

### ❌ No Hacer

1. **Nunca exponer** API keys en el código del cliente
2. **No hardcodear** keys en el código fuente
3. **No enviar** keys en query parameters
4. **No loggear** keys en consola o logs
5. **No commitear** `.env.local` al repositorio
6. **No compartir** keys por email o chat
7. **No reutilizar** keys entre proyectos

---

## Troubleshooting

### Error: "API Key inválida o faltante"

**Causas posibles:**
1. La API key no está configurada en `.env.local`
2. Las keys del frontend y backend no coinciden
3. El header `X-API-Key` no se está enviando correctamente

**Solución:**
1. Verifica que ambas variables estén configuradas:
   - Backend: `API_KEY`
   - Frontend: `PERMIT_API_KEY`
2. Asegúrate de que coincidan exactamente
3. Reinicia ambos servidores después de cambiar las keys

### Error: "No autorizado" en todas las requests

**Causa:** La API key no coincide entre frontend y backend.

**Solución:**
1. Compara `PERMIT_API_KEY` (frontend) con `API_KEY` (backend)
2. Asegúrate de que no haya espacios en blanco
3. Verifica que estés usando el archivo `.env.local` correcto

### La API key funciona en desarrollo pero no en producción

**Causas posibles:**
1. Variables de entorno no configuradas en el proveedor de hosting
2. Keys diferentes entre entornos
3. Cache de variables de entorno

**Solución:**
1. Verifica que las variables estén configuradas en Vercel/otro proveedor
2. Asegúrate de usar las keys correctas para producción
3. Reinicia el despliegue después de cambiar variables

---

## Ejemplos de Configuración por Entorno

### Desarrollo Local

```env
# Backend
API_KEY=dev-key-1234567890abcdef1234567890abcdef

# Frontend
PERMIT_API_KEY=dev-key-1234567890abcdef1234567890abcdef
```

### Staging

```env
# Backend
API_KEY=staging-key-abcdef1234567890abcdef1234567890

# Frontend
PERMIT_API_KEY=staging-key-abcdef1234567890abcdef1234567890
```

### Producción

```env
# Backend
API_KEY=prod-key-very-secure-random-string-here

# Frontend
PERMIT_API_KEY=prod-key-very-secure-random-string-here
```

---

## Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Best Practices for API Keys](https://cloud.google.com/endpoints/docs/openapi/when-why-api-key)

---

## Checklist de Seguridad

- [ ] API key generada con método seguro (mínimo 32 caracteres)
- [ ] Keys configuradas en `.env.local` (no commiteadas)
- [ ] Keys coinciden entre frontend y backend
- [ ] Diferentes keys para desarrollo, staging y producción
- [ ] Rotación programada (cada 3-6 meses)
- [ ] Monitoreo de intentos fallidos configurado
- [ ] HTTPS habilitado en producción
- [ ] Documentación del proceso de rotación

---

**Última actualización:** 2025-01-27

