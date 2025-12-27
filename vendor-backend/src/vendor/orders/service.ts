import { db } from '../../db.js'
import { orders, orderItems, paymentRecords, orderStatusEvents } from './schema.js'
import { customers } from '../customers/schema.js'
import { products } from '../products/schema.js'
import { eq } from 'drizzle-orm'
import { emitPermitAuditLog } from '../../audit/permit-client.js'
import { financeCreateArPayment } from '../../integrations/finance-client.js'
import {
	inventoryFindExternalProductByName,
	inventoryGetTotalAvailableStock,
	inventoryGetMappingToInternalItem,
} from '../../integrations/inventory-client.js'
import { factoryCreateProductionOrder } from '../../integrations/factory-client.js'

export interface CreateOrderInput {
	customerId: number
	status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
	total?: number
	items?: Array<{
		productId: number
		quantity: number
		unitPriceBase?: number
		unitPriceFinal?: number
		discountAmount?: number
		discountPercent?: number
	}>
}

export interface UpdateOrderInput {
	customerId?: number
	status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
	total?: number
}

export interface AuditContext {
	userId?: number | null
	ipAddress?: string
	userAgent?: string
	actorEmail?: string
	actorName?: string
}

/**
 * Servicio de órdenes con operaciones CRUD
 */
export class OrdersService {
	/**
	 * Obtener todas las órdenes con información del cliente
	 */
	static async getAllOrders() {
		try {
			const allOrders = await db
				.select({
					id: orders.id,
					customerId: orders.customerId,
					customerName: customers.name,
					status: orders.status,
					total: orders.total,
					createdAt: orders.createdAt,
					updatedAt: orders.updatedAt,
				})
				.from(orders)
				.leftJoin(customers, eq(orders.customerId, customers.id))

			return allOrders.map(order => ({
				...order,
				total: Number(order.total),
			}))
		} catch (error) {
			throw new Error(`Error al obtener órdenes: ${error}`)
		}
	}

	/**
	 * Obtener una orden por ID
	 */
	static async getOrderById(id: number) {
		try {
			const order = await db
				.select({
					id: orders.id,
					customerId: orders.customerId,
					customerName: customers.name,
					status: orders.status,
					total: orders.total,
					createdAt: orders.createdAt,
					updatedAt: orders.updatedAt,
				})
				.from(orders)
				.leftJoin(customers, eq(orders.customerId, customers.id))
				.where(eq(orders.id, id))
			
			if (order.length === 0) {
				throw new Error(`Orden con ID ${id} no encontrada`)
			}
			
			const orderHeader = {
				...order[0]!,
				total: Number(order[0]!.total),
			}

			const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
			const payments = await db.select().from(paymentRecords).where(eq(paymentRecords.orderId, id))
			const statusEvents = await db.select().from(orderStatusEvents).where(eq(orderStatusEvents.orderId, id))

			return {
				...orderHeader,
				items: items.map((i) => ({
					...i,
					unitPriceBase: Number(i.unitPriceBase),
					unitPriceFinal: Number(i.unitPriceFinal),
					discountAmount: Number(i.discountAmount),
					discountPercent: Number(i.discountPercent),
					lineTotal: Number(i.lineTotal),
				})),
				payments: payments.map((p) => ({
					...p,
					amount: Number(p.amount),
				})),
				statusEvents,
			}
		} catch (error: any) {
			throw new Error(`Error al obtener orden: ${error.message || error}`)
		}
	}

	/**
	 * Crear una nueva orden
	 */
	static async createOrder(data: CreateOrderInput, audit?: AuditContext) {
		try {
			// Verificar que el cliente existe
			const customer = await db
				.select()
				.from(customers)
				.where(eq(customers.id, data.customerId))
			
			if (customer.length === 0) {
				throw new Error(`Cliente con ID ${data.customerId} no encontrado`)
			}

			// Calcular items y total (si vienen items)
			let computedTotal = 0
			const itemsToInsert: any[] = []
			// Almacenar información para crear órdenes de producción después
			const pendingProductionOrders: Array<{
				productName: string
				internalItemId: number
				quantity: number
				availableStock: number
				requestedQuantity: number
			}> = []

			if (data.items && data.items.length > 0) {
				for (const item of data.items) {
					const product = await db.select().from(products).where(eq(products.id, item.productId))
					if (product.length === 0) {
						throw new Error(`Producto con ID ${item.productId} no encontrado`)
					}

					const productRow = product[0]!
					const unitBase = item.unitPriceBase ?? Number(productRow.price)
					const unitFinal = item.unitPriceFinal ?? unitBase
					const discountAmount = item.discountAmount ?? 0
					const discountPercent = item.discountPercent ?? 0
					const rawLine = unitFinal * item.quantity
					const discountFromPercent = (rawLine * discountPercent) / 100
					const lineTotal = Math.max(0, rawLine - discountAmount - discountFromPercent)
					computedTotal += lineTotal

					itemsToInsert.push({
						productId: item.productId,
						productName: productRow.name,
						quantity: item.quantity,
						unitPriceBase: unitBase.toString(),
						unitPriceFinal: unitFinal.toString(),
						discountAmount: discountAmount.toString(),
						discountPercent: discountPercent.toString(),
						lineTotal: lineTotal.toString(),
					})

					// Verificar stock en Inventory (sin bloquear si falla)
					try {
						// Buscar producto externo en Inventory por nombre
						const externalProduct = await inventoryFindExternalProductByName(productRow.name)
						
						if (externalProduct) {
							// Obtener stock disponible total
							const availableStock = await inventoryGetTotalAvailableStock(externalProduct.id)
							
							// Si no hay stock suficiente, preparar orden de producción
							if (availableStock < item.quantity) {
								// Buscar mapeo a item interno de Factory
								const mapping = await inventoryGetMappingToInternalItem(externalProduct.id)
								
								if (mapping) {
									// Calcular cantidad a producir (diferencia entre lo solicitado y lo disponible)
									const quantityToProduce = item.quantity - availableStock
									
									// Guardar para crear después de tener el orderId
									pendingProductionOrders.push({
										productName: productRow.name,
										internalItemId: mapping.internalItemId,
										quantity: quantityToProduce,
										availableStock,
										requestedQuantity: item.quantity,
									})
								}
							}
						}
					} catch (stockError: any) {
						// Silencioso: si no podemos verificar stock, no bloqueamos la creación de la orden
						console.error(`Error al verificar stock para producto ${productRow.name}:`, stockError)
					}
				}
			}

			const totalToSave = (data.total ?? computedTotal)

			const result = await db.insert(orders).values({
				customerId: data.customerId,
				status: data.status || 'pending',
				total: totalToSave.toString(),
				updatedAt: new Date(),
			}).returning()

			const orderId = result[0]!.id

			if (itemsToInsert.length > 0) {
				await db.insert(orderItems).values(
					itemsToInsert.map((i) => ({
						orderId,
						...i,
					}))
				)
			}

			// Crear órdenes de producción ahora que tenemos el orderId
			if (pendingProductionOrders.length > 0) {
				for (const prodOrder of pendingProductionOrders) {
					try {
						const productionOrder = await factoryCreateProductionOrder({
							vendorOrderId: orderId,
							internalItemId: prodOrder.internalItemId,
							quantity: prodOrder.quantity,
							priority: 1, // Alta prioridad para órdenes sin stock
							notes: `Orden automática: Stock insuficiente. Disponible: ${prodOrder.availableStock}, Solicitado: ${prodOrder.requestedQuantity}, Producto: ${prodOrder.productName}`,
						})
						
						// Log de la creación de orden de producción
						await emitPermitAuditLog({
							userId: audit?.userId ?? null,
							action: 'production_order_created',
							entityType: 'orders',
							entityId: orderId,
							changes: {
								after: {
									productionOrderId: productionOrder.id,
									internalItemId: prodOrder.internalItemId,
									quantity: prodOrder.quantity,
									reason: 'Stock insuficiente',
									productName: prodOrder.productName,
								},
							},
							metadata: {
								source: 'vendor-backend',
								integration: 'factory',
							},
						})
					} catch (factoryError: any) {
						// Silencioso: si no podemos crear la orden de producción, no bloqueamos
						console.error(`Error al crear orden de producción para ${prodOrder.productName}:`, factoryError)
						
						// Log del error (best-effort)
						await emitPermitAuditLog({
							userId: audit?.userId ?? null,
							action: 'production_order_creation_failed',
							entityType: 'orders',
							entityId: orderId,
							changes: {
								after: {
									error: factoryError.message || String(factoryError),
									productName: prodOrder.productName,
									internalItemId: prodOrder.internalItemId,
									quantity: prodOrder.quantity,
								},
							},
							metadata: {
								source: 'vendor-backend',
								integration: 'factory',
							},
						})
					}
				}
			}

			// Insertar evento inicial de status
			await db.insert(orderStatusEvents).values({
				orderId,
				fromStatus: null,
				toStatus: (data.status || 'pending') as any,
				reason: 'order_created',
			})

			// Audit best-effort
			await emitPermitAuditLog({
				userId: audit?.userId ?? null,
				action: 'create',
				entityType: 'orders',
				entityId: orderId,
				changes: { after: { customerId: data.customerId, status: data.status || 'pending', total: totalToSave } },
				ipAddress: audit?.ipAddress,
				userAgent: audit?.userAgent,
				metadata: { source: 'vendor-backend', actorEmail: audit?.actorEmail, actorName: audit?.actorName },
			})

			// Obtener la orden con información del cliente
			return await this.getOrderById(orderId)
		} catch (error: any) {
			throw new Error(`Error al crear orden: ${error.message || error}`)
		}
	}

	/**
	 * Actualizar una orden
	 */
	static async updateOrder(id: number, data: UpdateOrderInput, audit?: AuditContext) {
		try {
			// Verificar que la orden existe
			const before = await this.getOrderById(id)

			// Si se intenta cambiar el cliente, verificar que existe
			if (data.customerId) {
				const customer = await db
					.select()
					.from(customers)
					.where(eq(customers.id, data.customerId))
				
				if (customer.length === 0) {
					throw new Error(`Cliente con ID ${data.customerId} no encontrado`)
				}
			}

			const updateData: any = {
				updatedAt: new Date(),
			}
			
			if (data.customerId) updateData.customerId = data.customerId
			if (data.status) updateData.status = data.status
			if (data.total !== undefined) updateData.total = data.total.toString()

			await db
				.update(orders)
				.set(updateData)
				.where(eq(orders.id, id))

			await emitPermitAuditLog({
				userId: audit?.userId ?? null,
				action: 'update',
				entityType: 'orders',
				entityId: id,
				changes: { before, after: { ...before, ...data } },
				ipAddress: audit?.ipAddress,
				userAgent: audit?.userAgent,
				metadata: { source: 'vendor-backend', actorEmail: audit?.actorEmail, actorName: audit?.actorName },
			})

			return await this.getOrderById(id)
		} catch (error: any) {
			throw new Error(`Error al actualizar orden: ${error.message || error}`)
		}
	}

	/**
	 * Cambiar status de orden y guardar timeline
	 */
	static async updateOrderStatus(
		id: number,
		toStatus: UpdateOrderInput['status'],
		reason?: string,
		audit?: AuditContext
	) {
		try {
			const before = await this.getOrderById(id)
			const fromStatus = before.status as any
			if (!toStatus) throw new Error('toStatus es requerido')

			await db.update(orders).set({ status: toStatus as any, updatedAt: new Date() }).where(eq(orders.id, id))
			await db.insert(orderStatusEvents).values({
				orderId: id,
				fromStatus,
				toStatus: toStatus as any,
				reason,
			})

			await emitPermitAuditLog({
				userId: audit?.userId ?? null,
				action: 'status_change',
				entityType: 'orders',
				entityId: id,
				changes: { before: { status: fromStatus }, after: { status: toStatus } },
				ipAddress: audit?.ipAddress,
				userAgent: audit?.userAgent,
				metadata: { source: 'vendor-backend', reason, actorEmail: audit?.actorEmail, actorName: audit?.actorName },
			})

			return await this.getOrderById(id)
		} catch (error: any) {
			throw new Error(`Error al actualizar status: ${error.message || error}`)
		}
	}

	/**
	 * Registrar pago manual (transferencia)
	 */
	static async addPayment(
		orderId: number,
		input: { amount: number; reference?: string; proofUrl?: string; notes?: string; paidAt?: string },
		audit?: AuditContext
	) {
		try {
			// Verificar orden
			const order = await this.getOrderById(orderId)

			const created = await db.insert(paymentRecords).values({
				orderId,
				amount: input.amount.toString(),
				reference: input.reference,
				proofUrl: input.proofUrl,
				notes: input.notes,
				paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
				status: 'confirmed' as any,
			}).returning()

			// Replicar a Finance (AR) best-effort
			await financeCreateArPayment({
				externalRef: `vendor:payment_records:${created[0]!.id}`,
				customerId: order.customerId,
				orderId,
				amount: input.amount,
				currency: 'MXN',
				reference: input.reference,
				proofUrl: input.proofUrl,
				notes: input.notes,
				paidAt: input.paidAt,
			})

			await emitPermitAuditLog({
				userId: audit?.userId ?? null,
				action: 'payment_recorded',
				entityType: 'orders',
				entityId: orderId,
				changes: { after: created[0] },
				ipAddress: audit?.ipAddress,
				userAgent: audit?.userAgent,
				metadata: { source: 'vendor-backend', actorEmail: audit?.actorEmail, actorName: audit?.actorName },
			})

			return created[0]!
		} catch (error: any) {
			throw new Error(`Error al registrar pago: ${error.message || error}`)
		}
	}

	/**
	 * Eliminar una orden
	 */
	static async deleteOrder(id: number, audit?: AuditContext) {
		try {
			// Verificar que la orden existe
			const order = await this.getOrderById(id)

			const result = await db.delete(orders).where(eq(orders.id, id)).returning()

			await emitPermitAuditLog({
				userId: audit?.userId ?? null,
				action: 'delete',
				entityType: 'orders',
				entityId: id,
				changes: { before: order },
				ipAddress: audit?.ipAddress,
				userAgent: audit?.userAgent,
				metadata: { source: 'vendor-backend', actorEmail: audit?.actorEmail, actorName: audit?.actorName },
			})
			
			return {
				...order,
				order: result[0]!,
			}
		} catch (error: any) {
			throw new Error(`Error al eliminar orden: ${error.message || error}`)
		}
	}
}

