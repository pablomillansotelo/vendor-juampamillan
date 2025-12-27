/**
 * Cliente para Factory Backend
 * Maneja timeouts, retries y audit logging en fallos
 */

const FACTORY_API_URL = process.env.FACTORY_API_URL || 'http://localhost:8000'
const FACTORY_API_KEY = process.env.FACTORY_API_KEY || process.env.VENDOR_API_KEY || ''
const FACTORY_TIMEOUT_MS = 5000 // 5 segundos

interface CreateProductionOrderInput {
  vendorOrderId: number
  internalItemId: number
  quantity: number
  priority?: number
  notes?: string
  estimatedCompletionDate?: string
}

interface ProductionOrder {
  id: number
  vendorOrderId: number
  internalItemId: number
  quantity: number
  priority: number
  status: string
  notes?: string | null
  estimatedCompletionDate?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Crear orden de producción en Factory
 */
export async function factoryCreateProductionOrder(
  data: CreateProductionOrderInput
): Promise<ProductionOrder> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FACTORY_TIMEOUT_MS)

  try {
    const response = await fetch(`${FACTORY_API_URL}/v1/production-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': FACTORY_API_KEY,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `Factory API error: ${response.status}`
      )
    }

    const result = await response.json()
    return result.data
  } catch (error: any) {
    clearTimeout(timeoutId)

    // Si es timeout o error de red, intentar una vez más
    if (error.name === 'AbortError' || error.message.includes('fetch')) {
      try {
        const retryResponse = await fetch(`${FACTORY_API_URL}/v1/production-orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': FACTORY_API_KEY,
          },
          body: JSON.stringify(data),
        })

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}))
          throw new Error(
            errorData.message || `Factory API error (retry): ${retryResponse.status}`
          )
        }

        const result = await retryResponse.json()
        return result.data
      } catch (retryError: any) {
        // Log audit en Permit (best-effort)
        await logFactoryIntegrationFailure('create_production_order', data, retryError)
        throw retryError
      }
    }

    // Log audit en Permit (best-effort)
    await logFactoryIntegrationFailure('create_production_order', data, error)
    throw error
  }
}

/**
 * Log de fallos de integración con Factory a Permit (best-effort)
 */
async function logFactoryIntegrationFailure(
  action: string,
  data: any,
  error: any
) {
  try {
    const PERMIT_API_URL = process.env.PERMIT_API_URL || 'http://localhost:8000'
    const PERMIT_API_KEY = process.env.PERMIT_API_KEY || ''

    await fetch(`${PERMIT_API_URL}/v1/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PERMIT_API_KEY,
      },
      body: JSON.stringify({
        userId: null,
        action: `factory_integration_failure:${action}`,
        entityType: 'vendor_orders',
        entityId: data.vendorOrderId,
        changes: { error: error.message || String(error), requestData: data },
        metadata: {
          source: 'vendor-backend',
          integration: 'factory',
          action,
        },
      }),
    })
  } catch (auditError) {
    // Silencioso: si no podemos loguear el audit, no bloqueamos
    console.error('Error al loguear audit de integración Factory:', auditError)
  }
}

