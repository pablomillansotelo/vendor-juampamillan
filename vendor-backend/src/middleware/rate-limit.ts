/**
 * Middleware de Rate Limiting
 * 
 * Implementa rate limiting por API key usando un mapa en memoria.
 * Para producción distribuida, considerar usar Redis.
 */

interface RateLimitEntry {
	count: number
	resetAt: number
}

// Mapa en memoria para almacenar contadores de rate limit
// En producción, usar Redis o similar para múltiples instancias
const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada minuto
setInterval(() => {
	const now = Date.now()
	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetAt < now) {
			rateLimitStore.delete(key)
		}
	}
}, 60000) // Cada minuto

/**
 * Verificar rate limit para una API key
 * @param apiKeyId ID de la API key
 * @param rateLimit Límite de requests por minuto
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(apiKeyId: number, rateLimit: number): {
	allowed: boolean
	remaining: number
	resetAt: number
} {
	const key = `api_key_${apiKeyId}`
	const now = Date.now()
	const windowMs = 60000 // 1 minuto

	// Obtener o crear entrada
	let entry = rateLimitStore.get(key)

	if (!entry || entry.resetAt < now) {
		// Nueva ventana de tiempo
		entry = {
			count: 0,
			resetAt: now + windowMs,
		}
		rateLimitStore.set(key, entry)
	}

	// Incrementar contador
	entry.count++

	const remaining = Math.max(0, rateLimit - entry.count)
	const allowed = entry.count <= rateLimit

	return {
		allowed,
		remaining,
		resetAt: entry.resetAt,
	}
}

/**
 * Obtener headers de rate limit para la respuesta
 */
export function getRateLimitHeaders(apiKeyId: number, rateLimit: number): Record<string, string> {
	const result = checkRateLimit(apiKeyId, rateLimit)
	return {
		'X-RateLimit-Limit': rateLimit.toString(),
		'X-RateLimit-Remaining': result.remaining.toString(),
		'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(), // Unix timestamp
	}
}

