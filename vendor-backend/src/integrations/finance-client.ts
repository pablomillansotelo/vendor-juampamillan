/**
 * Integración best-effort con Finance (AR).
 * - Nunca rompe la operación principal.
 * - Timeout + 1 retry (backoff).
 * - Idempotencia se logra con `externalRef` del lado de Finance.
 * - En falla final, registra `integration_failed` en Permit (audit logs).
 */

import { emitPermitAuditLog } from '../audit/permit-client.js'

const FINANCE_API_URL = process.env.FINANCE_API_URL || 'http://localhost:8000'
const FINANCE_API_KEY = process.env.FINANCE_API_KEY || ''

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postJsonWithTimeout(url: string, body: any, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': FINANCE_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function financeCreateArPayment(input: {
  externalRef: string
  customerId: number
  orderId?: number
  amount: number
  currency?: string
  method?: 'bank_transfer'
  reference?: string
  proofUrl?: string
  notes?: string
  paidAt?: string
  metadata?: any
}): Promise<void> {
  try {
    if (!FINANCE_API_KEY) {
      console.warn('⚠️ FINANCE_API_KEY no configurada: saltando AR payment')
      return
    }

    const url = `${FINANCE_API_URL}/v1/ar/payments`
    const payload = {
      externalRef: input.externalRef,
      customerId: input.customerId,
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency || 'MXN',
      method: input.method || 'bank_transfer',
      reference: input.reference,
      proofUrl: input.proofUrl,
      notes: input.notes,
      paidAt: input.paidAt,
      metadata: input.metadata,
    }

    let lastErr: any = null

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await postJsonWithTimeout(url, payload, 3000)
        if (res.ok) return

        const data = await res.json().catch(() => ({}))
        lastErr = { status: res.status, data }
        console.warn('⚠️ Finance AR payment falló:', res.status, data?.message || data)
      } catch (err) {
        lastErr = err
        console.warn(`⚠️ Error llamando Finance (AR) attempt ${attempt}:`, err)
      }

      if (attempt < 2) {
        await sleep(250)
      }
    }

    // Falla final: registrar integración fallida en Permit (best-effort)
    await emitPermitAuditLog({
      userId: null,
      action: 'integration_failed',
      entityType: 'integrations',
      entityId: null,
      changes: {
        after: {
          source: 'vendor-backend',
          target: 'finance-backend',
          endpoint: '/v1/ar/payments',
          method: 'POST',
          externalRef: input.externalRef,
          orderId: input.orderId,
          customerId: input.customerId,
        },
      },
      metadata: { error: lastErr },
    })
  } catch (err) {
    console.warn('⚠️ Error en financeCreateArPayment (wrapper):', err)
  }
}


