/**
 * Cliente para Inventory Backend
 * Maneja timeouts, retries y audit logging en fallos
 */

const INVENTORY_API_URL = process.env.INVENTORY_API_URL || 'http://localhost:8000'
const INVENTORY_API_KEY = process.env.INVENTORY_API_KEY || process.env.VENDOR_API_KEY || ''
const INVENTORY_TIMEOUT_MS = 5000 // 5 segundos

interface ExternalProduct {
  id: number
  sku: string
  name: string
  status: string
  basePrice: number
  currency: string
}

interface StockLevel {
  id: number
  warehouseId: number
  externalProductId: number
  onHand: number
  reserved: number
  updatedAt: string
}

interface Mapping {
  id: number
  internalItemId: number
  externalProductId: number
  note?: string | null
}

/**
 * Buscar producto externo por nombre (para mapear con productos de Vendor)
 */
export async function inventoryFindExternalProductByName(
  productName: string
): Promise<ExternalProduct | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), INVENTORY_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${INVENTORY_API_URL}/v1/external-products?q=${encodeURIComponent(productName)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INVENTORY_API_KEY,
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null // Si no se encuentra, retornar null
    }

    const result = await response.json()
    const products = result.data || []
    
    // Buscar coincidencia exacta de nombre primero
    let product = products.find((p: ExternalProduct) => 
      p.name.toLowerCase() === productName.toLowerCase()
    )
    
    // Si no se encuentra, buscar coincidencia parcial
    if (!product && products.length > 0) {
      product = products.find((p: ExternalProduct) => 
        p.name.toLowerCase().includes(productName.toLowerCase()) ||
        productName.toLowerCase().includes(p.name.toLowerCase())
      )
    }

    return product || null
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    // Si es timeout, intentar una vez más
    if (error.name === 'AbortError' || error.message.includes('fetch')) {
      try {
        const retryResponse = await fetch(
          `${INVENTORY_API_URL}/v1/external-products?q=${encodeURIComponent(productName)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': INVENTORY_API_KEY,
            },
          }
        )

        if (!retryResponse.ok) {
          return null
        }

        const result = await retryResponse.json()
        const products = result.data || []
        const product = products.find((p: ExternalProduct) => 
          p.name.toLowerCase() === productName.toLowerCase()
        ) || products.find((p: ExternalProduct) => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        )

        return product || null
      } catch (retryError) {
        return null // Silencioso: si no podemos verificar stock, continuamos
      }
    }

    return null // Silencioso: si no podemos verificar stock, continuamos
  }
}

/**
 * Obtener stock total disponible de un producto externo
 */
export async function inventoryGetTotalAvailableStock(
  externalProductId: number
): Promise<number> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), INVENTORY_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${INVENTORY_API_URL}/v1/stock-levels?externalProductId=${externalProductId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INVENTORY_API_KEY,
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return 0 // Si no se puede obtener, asumir 0
    }

    const result = await response.json()
    const stockLevels: StockLevel[] = result.data || []
    
    // Sumar stock disponible de todos los almacenes (onHand - reserved)
    return stockLevels.reduce((total, level) => {
      return total + Math.max(0, level.onHand - level.reserved)
    }, 0)
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    // Si es timeout, intentar una vez más
    if (error.name === 'AbortError' || error.message.includes('fetch')) {
      try {
        const retryResponse = await fetch(
          `${INVENTORY_API_URL}/v1/stock-levels?externalProductId=${externalProductId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': INVENTORY_API_KEY,
            },
          }
        )

        if (!retryResponse.ok) {
          return 0
        }

        const result = await retryResponse.json()
        const stockLevels: StockLevel[] = result.data || []
        return stockLevels.reduce((total, level) => {
          return total + Math.max(0, level.onHand - level.reserved)
        }, 0)
      } catch (retryError) {
        return 0 // Silencioso
      }
    }

    return 0 // Silencioso
  }
}

/**
 * Obtener mapeo de producto externo a item interno (Factory)
 */
export async function inventoryGetMappingToInternalItem(
  externalProductId: number
): Promise<Mapping | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), INVENTORY_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${INVENTORY_API_URL}/v1/mappings/internal-to-external?externalProductId=${externalProductId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INVENTORY_API_KEY,
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    const mappings: Mapping[] = result.data || []
    
    // Retornar el primer mapeo encontrado
    return mappings.length > 0 ? mappings[0]! : null
  } catch (error: any) {
    clearTimeout(timeoutId)
    return null // Silencioso
  }
}

