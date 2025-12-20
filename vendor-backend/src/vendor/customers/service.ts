import { db } from '../../db.js'
import { customers } from './schema.js'
import { eq, or, like } from 'drizzle-orm'
import { emitPermitAuditLog } from '../../audit/permit-client.js'

export interface AuditContext {
	userId?: number | null
	ipAddress?: string
	userAgent?: string
}

export interface CreateCustomerInput {
	name: string
	email: string
	phone?: string
	address?: string
}

export interface UpdateCustomerInput {
	name?: string
	email?: string
	phone?: string
	address?: string
}

/**
 * Servicio de clientes con operaciones CRUD
 */
export class CustomersService {
	/**
	 * Obtener todos los clientes
	 */
	static async getAllCustomers() {
		try {
			const allCustomers = await db.select().from(customers)
			return allCustomers
		} catch (error) {
			throw new Error(`Error al obtener clientes: ${error}`)
		}
	}

	/**
	 * Obtener un cliente por ID
	 */
	static async getCustomerById(id: number) {
		try {
			const customer = await db.select().from(customers).where(eq(customers.id, id))
			
			if (customer.length === 0) {
				throw new Error(`Cliente con ID ${id} no encontrado`)
			}
			
			return customer[0]!
		} catch (error: any) {
			throw new Error(`Error al obtener cliente: ${error.message || error}`)
		}
	}

	/**
	 * Crear un nuevo cliente
	 */
	static async createCustomer(data: CreateCustomerInput) {
		try {
			const result = await db
				.insert(customers)
				.values({
					name: data.name,
					email: data.email,
					phone: data.phone || null,
					address: data.address || null,
					updatedAt: new Date(),
				})
				.returning()

			await emitPermitAuditLog({
				userId: null,
				action: 'create',
				entityType: 'customers',
				entityId: result[0]!.id,
				changes: { after: result[0] },
				metadata: { source: 'vendor-backend' },
			})

			return result[0]!
		} catch (error: any) {
			throw new Error(`Error al crear cliente: ${error.message || error}`)
		}
	}

	/**
	 * Actualizar un cliente
	 */
	static async updateCustomer(id: number, data: UpdateCustomerInput) {
		try {
			// Verificar que el cliente existe
			const before = await this.getCustomerById(id)

			const updateData: any = {
				updatedAt: new Date(),
			}
			
			if (data.name) updateData.name = data.name
			if (data.email) updateData.email = data.email
			if (data.phone !== undefined) updateData.phone = data.phone || null
			if (data.address !== undefined) updateData.address = data.address || null

			const result = await db
				.update(customers)
				.set(updateData)
				.where(eq(customers.id, id))
				.returning()

			await emitPermitAuditLog({
				userId: null,
				action: 'update',
				entityType: 'customers',
				entityId: id,
				changes: { before, after: result[0] },
				metadata: { source: 'vendor-backend' },
			})

			return result[0]!
		} catch (error: any) {
			throw new Error(`Error al actualizar cliente: ${error.message || error}`)
		}
	}

	/**
	 * Eliminar un cliente
	 */
	static async deleteCustomer(id: number) {
		try {
			// Verificar que el cliente existe
			const before = await this.getCustomerById(id)

			const result = await db.delete(customers).where(eq(customers.id, id)).returning()

			await emitPermitAuditLog({
				userId: null,
				action: 'delete',
				entityType: 'customers',
				entityId: id,
				changes: { before },
				metadata: { source: 'vendor-backend' },
			})
			
			return result[0]!
		} catch (error: any) {
			throw new Error(`Error al eliminar cliente: ${error.message || error}`)
		}
	}
}

