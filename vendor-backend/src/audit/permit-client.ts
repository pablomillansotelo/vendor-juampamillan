/**
 * Cliente mínimo para emitir logs de auditoría hacia Permit.
 *
 * Vendor NO es dueño de users/auditoría; solo reporta eventos.
 * Este helper debe ser "best-effort": nunca debe romper la operación principal.
 */

const PERMIT_API_URL = process.env.PERMIT_API_URL || 'http://localhost:8000'
const PERMIT_API_KEY = process.env.PERMIT_API_KEY || ''

export type PermitAuditLogInput = {
  userId?: number | null
  action: string
  entityType: string
  entityId?: number | null
  changes?: { before?: any; after?: any }
  ipAddress?: string
  userAgent?: string
  metadata?: any
}

export async function emitPermitAuditLog(input: PermitAuditLogInput): Promise<void> {
  try {
    if (!PERMIT_API_KEY) {
      // En dev puede no estar; no fallar.
      console.warn('⚠️ PERMIT_API_KEY no configurada: saltando audit log')
      return
    }

    const res = await fetch(`${PERMIT_API_URL}/v1/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PERMIT_API_KEY,
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.warn('⚠️ Falló audit log en Permit:', res.status, data?.message || data)
    }
  } catch (err) {
    console.warn('⚠️ Error emitiendo audit log hacia Permit:', err)
  }
}


