import { db } from '../db.js'
import { apiKeys } from './schema.js'
import { eq } from 'drizzle-orm'
import { randomBytes, createHash } from 'crypto'

export interface CreateApiKeyInput {
	name: string
	scopes?: string[]
	rateLimit?: number
	expiresAt?: Date
	createdBy?: number
}

export interface UpdateApiKeyInput {
	name?: string
	scopes?: string[]
	rateLimit?: number
	expiresAt?: Date
	isActive?: string
}

/**
 * Servicio de API Keys
 */
export class ApiKeysService {
	/**
	 * Generar una nueva API key
	 */
	static generateApiKey(): string {
		// Generar key aleatoria de 32 bytes (64 caracteres hex)
		const key = randomBytes(32).toString('hex')
		return `pk_${key}`
	}

	/**
	 * Hashear una API key para almacenamiento seguro
	 */
	static hashApiKey(key: string): string {
		return createHash('sha256').update(key).digest('hex')
	}

	/**
	 * Crear una nueva API key
	 */
	static async createApiKey(data: CreateApiKeyInput): Promise<{ key: string; apiKey: any }> {
		try {
			// Generar nueva key
			const key = this.generateApiKey()
			const keyHash = this.hashApiKey(key)

			// Insertar en base de datos
			const result = await db.insert(apiKeys).values({
				keyHash,
				name: data.name,
				scopes: data.scopes || [],
				rateLimit: data.rateLimit || 100,
				expiresAt: data.expiresAt,
				createdBy: data.createdBy,
				isActive: 'active',
			}).returning()

			// Retornar la key en texto plano SOLO en la creación
			// Después de esto, nunca se podrá recuperar la key original
			return {
				key,
				apiKey: this.transformApiKeyData(result[0]!),
			}
		} catch (error: any) {
			throw new Error(`Error al crear API key: ${error.message || error}`)
		}
	}

	/**
	 * Validar una API key
	 */
	static async validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: any; error?: string }> {
		try {
			const keyHash = this.hashApiKey(key)
			
			const result = await db
				.select()
				.from(apiKeys)
				.where(eq(apiKeys.keyHash, keyHash))

			if (result.length === 0) {
				return { valid: false, error: 'API key no encontrada' }
			}

			const apiKey = result[0]!

			// Verificar si está activa
			if (apiKey.isActive !== 'active') {
				return { valid: false, error: 'API key inactiva o revocada' }
			}

			// Verificar expiración
			if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
				return { valid: false, error: 'API key expirada' }
			}

			// Actualizar lastUsedAt
			await db
				.update(apiKeys)
				.set({ lastUsedAt: new Date() })
				.where(eq(apiKeys.id, apiKey.id))

			return { valid: true, apiKey }
		} catch (error: any) {
			return { valid: false, error: `Error al validar API key: ${error.message}` }
		}
	}

	/**
	 * Verificar si una API key tiene un scope específico
	 */
	static hasScope(apiKey: any, scope: string): boolean {
		if (!apiKey.scopes || !Array.isArray(apiKey.scopes)) {
			return false
		}
		// Si tiene el scope '*' tiene acceso a todo
		return apiKey.scopes.includes('*') || apiKey.scopes.includes(scope)
	}

	/**
	 * Transformar datos de API key para respuesta
	 */
	private static transformApiKeyData(key: any): any {
		const transformed: any = {
			id: key.id,
			name: key.name,
			scopes: key.scopes || null,
			rateLimit: key.rateLimit ?? 100, // Asegurar que siempre sea un número
			expiresAt: key.expiresAt ? new Date(key.expiresAt).toISOString() : null,
			createdBy: key.createdBy || null,
			createdAt: key.createdAt ? new Date(key.createdAt).toISOString() : new Date().toISOString(),
			lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt).toISOString() : null,
			isActive: key.isActive || 'active',
		}
		// No incluir keyHash por seguridad
		return transformed
	}

	/**
	 * Obtener todas las API keys
	 */
	static async getAllApiKeys() {
		try {
			const allKeys = await db.select().from(apiKeys)
			// Transformar y no retornar el hash por seguridad
			return allKeys.map(k => this.transformApiKeyData(k))
		} catch (error) {
			throw new Error(`Error al obtener API keys: ${error}`)
		}
	}

	/**
	 * Actualizar una API key
	 */
	static async updateApiKey(id: number, data: UpdateApiKeyInput) {
		try {
			const updateData: any = {}
			if (data.name !== undefined) updateData.name = data.name
			if (data.scopes !== undefined) updateData.scopes = data.scopes
			if (data.rateLimit !== undefined) updateData.rateLimit = data.rateLimit
			if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt
			if (data.isActive !== undefined) updateData.isActive = data.isActive

			const result = await db
				.update(apiKeys)
				.set(updateData)
				.where(eq(apiKeys.id, id))
				.returning()

			if (result.length === 0) {
				throw new Error('API key no encontrada')
			}

			return this.transformApiKeyData(result[0]!)
		} catch (error: any) {
			throw new Error(`Error al actualizar API key: ${error.message || error}`)
		}
	}

	/**
	 * Revocar una API key
	 */
	static async revokeApiKey(id: number) {
		try {
			const result = await db
				.update(apiKeys)
				.set({ isActive: 'revoked' })
				.where(eq(apiKeys.id, id))
				.returning()

			return this.transformApiKeyData(result[0]!)
		} catch (error: any) {
			throw new Error(`Error al revocar API key: ${error.message || error}`)
		}
	}
}

