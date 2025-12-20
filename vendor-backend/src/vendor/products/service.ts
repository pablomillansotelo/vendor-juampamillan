import { db } from '../../db.js'
import { products } from './schema.js'
import { eq, and, or, like, sql } from 'drizzle-orm'
import { emitPermitAuditLog } from '../../audit/permit-client.js'

export interface CreateProductInput {
	imageUrl: string
	name: string
	status?: 'active' | 'inactive' | 'archived'
	price: number
	stock?: number
	availableAt?: string | Date
}

export interface UpdateProductInput {
	imageUrl?: string
	name?: string
	status?: 'active' | 'inactive' | 'archived'
	price?: number
	stock?: number
	availableAt?: string | Date
}

export interface ProductFilters {
	status?: 'active' | 'inactive' | 'archived'
	search?: string
	offset?: number
	limit?: number
}

export interface AuditContext {
	userId?: number | null
	ipAddress?: string
	userAgent?: string
}

/**
 * Servicio de productos con operaciones CRUD
 */
export class ProductsService {
	/**
	 * Obtener todos los productos con filtros opcionales
	 */
	static async getAllProducts(filters?: ProductFilters) {
		try {
			let query = db.select().from(products)
			const conditions = []

			if (filters?.status) {
				conditions.push(eq(products.status, filters.status))
			}

			if (filters?.search) {
				conditions.push(
					or(
						like(products.name, `%${filters.search}%`)
					)!
				)
			}

			if (conditions.length > 0) {
				query = query.where(and(...conditions))
			}

			// Contar total antes de aplicar paginación
			const countQuery = conditions.length > 0
				? db.select({ count: sql<number>`count(*)` }).from(products).where(and(...conditions))
				: db.select({ count: sql<number>`count(*)` }).from(products)
			
			const [countResult] = await countQuery
			const total = Number(countResult?.count || 0)

			// Aplicar paginación
			if (filters?.limit) {
				query = query.limit(filters.limit)
			}
			if (filters?.offset) {
				query = query.offset(filters.offset)
			}

			const allProducts = await query

			return {
				products: allProducts.map(p => ({
					...p,
					price: Number(p.price),
				})),
				total,
				offset: filters?.offset || null,
			}
		} catch (error) {
			throw new Error(`Error al obtener productos: ${error}`)
		}
	}

	/**
	 * Obtener un producto por ID
	 */
	static async getProductById(id: number) {
		try {
			const product = await db.select().from(products).where(eq(products.id, id))
			
			if (product.length === 0) {
				throw new Error(`Producto con ID ${id} no encontrado`)
			}
			
			return {
				...product[0]!,
				price: Number(product[0]!.price),
			}
		} catch (error: any) {
			throw new Error(`Error al obtener producto: ${error.message || error}`)
		}
	}

	/**
	 * Crear un nuevo producto
	 */
	static async createProduct(data: CreateProductInput) {
		try {
			const result = await db
				.insert(products)
				.values({
					imageUrl: data.imageUrl,
					name: data.name,
					status: data.status || 'active',
					price: data.price.toString(),
					stock: data.stock || 0,
					availableAt: data.availableAt ? new Date(data.availableAt) : new Date(),
					updatedAt: new Date(),
				})
				.returning()

			await emitPermitAuditLog({
				userId: null,
				action: 'create',
				entityType: 'products',
				entityId: result[0]!.id,
				changes: { after: result[0] },
				metadata: { source: 'vendor-backend' },
			})

			return {
				...result[0]!,
				price: Number(result[0]!.price),
			}
		} catch (error: any) {
			throw new Error(`Error al crear producto: ${error.message || error}`)
		}
	}

	/**
	 * Actualizar un producto
	 */
	static async updateProduct(id: number, data: UpdateProductInput) {
		try {
			// Verificar que el producto existe
			const before = await this.getProductById(id)

			const updateData: any = {
				updatedAt: new Date(),
			}
			
			if (data.imageUrl) updateData.imageUrl = data.imageUrl
			if (data.name) updateData.name = data.name
			if (data.status) updateData.status = data.status
			if (data.price !== undefined) updateData.price = data.price.toString()
			if (data.stock !== undefined) updateData.stock = data.stock
			if (data.availableAt) updateData.availableAt = new Date(data.availableAt)

			const result = await db
				.update(products)
				.set(updateData)
				.where(eq(products.id, id))
				.returning()

			await emitPermitAuditLog({
				userId: null,
				action: 'update',
				entityType: 'products',
				entityId: id,
				changes: { before, after: result[0] },
				metadata: { source: 'vendor-backend' },
			})

			return {
				...result[0]!,
				price: Number(result[0]!.price),
			}
		} catch (error: any) {
			throw new Error(`Error al actualizar producto: ${error.message || error}`)
		}
	}

	/**
	 * Eliminar un producto
	 */
	static async deleteProduct(id: number) {
		try {
			// Verificar que el producto existe
			const before = await this.getProductById(id)

			const result = await db.delete(products).where(eq(products.id, id)).returning()

			await emitPermitAuditLog({
				userId: null,
				action: 'delete',
				entityType: 'products',
				entityId: id,
				changes: { before },
				metadata: { source: 'vendor-backend' },
			})
			
			return {
				...result[0]!,
				price: Number(result[0]!.price),
			}
		} catch (error: any) {
			throw new Error(`Error al eliminar producto: ${error.message || error}`)
		}
	}
}

