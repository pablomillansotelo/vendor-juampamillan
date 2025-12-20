/**
 * Configuración de CORS y Headers de Seguridad
 */

export interface CorsConfig {
	origin?: string | string[] | ((origin: string | null) => boolean)
	methods?: string[]
	allowedHeaders?: string[]
	exposedHeaders?: string[]
	credentials?: boolean
	maxAge?: number
}

const defaultCorsConfig: CorsConfig = {
	origin: process.env.CORS_ORIGIN || '*', // En producción, especificar dominios permitidos
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
	exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
	credentials: true,
	maxAge: 86400, // 24 horas
}

/**
 * Verificar si un origen está permitido
 */
function isOriginAllowed(origin: string | null, config: CorsConfig): boolean {
	if (!origin) return false

	const allowedOrigin = config.origin || defaultCorsConfig.origin

	if (typeof allowedOrigin === 'string') {
		return allowedOrigin === '*' || allowedOrigin === origin
	}

	if (Array.isArray(allowedOrigin)) {
		return allowedOrigin.includes(origin)
	}

	if (typeof allowedOrigin === 'function') {
		return allowedOrigin(origin)
	}

	return false
}

/**
 * Obtener headers de CORS para una respuesta
 */
export function getCorsHeaders(origin: string | null, config: CorsConfig = defaultCorsConfig): Record<string, string> {
	const headers: Record<string, string> = {}

	if (isOriginAllowed(origin, config)) {
		headers['Access-Control-Allow-Origin'] = origin || '*'
		if (config.credentials) {
			headers['Access-Control-Allow-Credentials'] = 'true'
		}
	}

	if (config.methods) {
		headers['Access-Control-Allow-Methods'] = config.methods.join(', ')
	}

	if (config.allowedHeaders) {
		headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ')
	}

	if (config.exposedHeaders) {
		headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ')
	}

	if (config.maxAge) {
		headers['Access-Control-Max-Age'] = config.maxAge.toString()
	}

	return headers
}

/**
 * Obtener headers de seguridad
 * @param isSwagger Si es true, usa un CSP más permisivo para Swagger
 */
export function getSecurityHeaders(isSwagger: boolean = false): Record<string, string> {
	// CSP más permisivo para Swagger que necesita cargar recursos externos
	const csp = isSwagger
		? "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net https://unpkg.com;"
		: "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:;"

	return {
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': isSwagger ? 'SAMEORIGIN' : 'DENY', // Swagger necesita iframe
		'X-XSS-Protection': '1; mode=block',
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
		'Content-Security-Policy': csp,
		'Referrer-Policy': 'strict-origin-when-cross-origin',
	}
}

/**
 * Obtener configuración de CORS por defecto
 */
export function getDefaultCorsConfig(): CorsConfig {
	return defaultCorsConfig
}

