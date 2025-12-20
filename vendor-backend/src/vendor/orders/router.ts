import { Elysia, t } from 'elysia'
import { OrdersService } from './service.js'

function parseNumberLike(value: unknown, fieldName: string): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value
	if (typeof value === 'string') {
		const n = Number(value)
		if (Number.isFinite(n)) return n
	}
	throw new Error(`Campo inválido: ${fieldName} debe ser numérico`)
}

export const ordersRouter = new Elysia({ prefix: '/orders' })
	/**
	 * GET /orders - Obtener todas las órdenes
	 */
	.get(
		'/',
		async () => {
			try {
				const allOrders = await OrdersService.getAllOrders()
				return allOrders
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			detail: {
				tags: ['orders'],
				summary: 'Obtener todas las órdenes',
			},
		}
	)
	/**
	 * GET /orders/:id - Obtener una orden por ID
	 */
	.get(
		'/:id',
		async ({ params }) => {
			try {
				const order = await OrdersService.getOrderById(Number(params.id))
				return order
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			detail: {
				tags: ['orders'],
				summary: 'Obtener una orden por ID',
			},
		}
	)
	/**
	 * POST /orders - Crear una nueva orden
	 */
	.post(
		'/',
		async ({ body, request }) => {
			try {
				const ipAddress =
					request.headers.get('x-forwarded-for') ||
					request.headers.get('x-real-ip') ||
					undefined
				const userAgent = request.headers.get('user-agent') || undefined
				const actorEmail = request.headers.get('x-actor-email') || undefined
				const actorName = request.headers.get('x-actor-name') || undefined

				const coercedBody: any = {
					...body,
					total: (body as any).total !== undefined ? parseNumberLike((body as any).total, 'total') : undefined,
					items: (body as any).items?.map((it: any) => ({
						...it,
						unitPriceBase: it.unitPriceBase !== undefined ? parseNumberLike(it.unitPriceBase, 'items.unitPriceBase') : undefined,
						unitPriceFinal: it.unitPriceFinal !== undefined ? parseNumberLike(it.unitPriceFinal, 'items.unitPriceFinal') : undefined,
						discountAmount: it.discountAmount !== undefined ? parseNumberLike(it.discountAmount, 'items.discountAmount') : undefined,
						discountPercent: it.discountPercent !== undefined ? parseNumberLike(it.discountPercent, 'items.discountPercent') : undefined,
					})),
				}

				const newOrder = await OrdersService.createOrder(coercedBody, {
					userId: null,
					ipAddress: ipAddress ? String(ipAddress) : undefined,
					userAgent: userAgent ? String(userAgent) : undefined,
					actorEmail: actorEmail ? String(actorEmail) : undefined,
					actorName: actorName ? String(actorName) : undefined,
				})
				return newOrder
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: t.Object({
				customerId: t.Number(),
				status: t.Optional(t.Union([
					t.Literal('pending'),
					t.Literal('processing'),
					t.Literal('shipped'),
					t.Literal('delivered'),
					t.Literal('cancelled')
				])),
				total: t.Optional(t.Union([t.Number(), t.String()])),
				items: t.Optional(t.Array(t.Object({
					productId: t.Number(),
					quantity: t.Number(),
					unitPriceBase: t.Optional(t.Union([t.Number(), t.String()])),
					unitPriceFinal: t.Optional(t.Union([t.Number(), t.String()])),
					discountAmount: t.Optional(t.Union([t.Number(), t.String()])),
					discountPercent: t.Optional(t.Union([t.Number(), t.String()])),
				}))),
			}),
			detail: {
				tags: ['orders'],
				summary: 'Crear una nueva orden',
			},
		}
	)
	/**
	 * PUT /orders/:id - Actualizar una orden
	 */
	.put(
		'/:id',
		async ({ params, body, request }) => {
			try {
				const ipAddress =
					request.headers.get('x-forwarded-for') ||
					request.headers.get('x-real-ip') ||
					undefined
				const userAgent = request.headers.get('user-agent') || undefined
				const actorEmail = request.headers.get('x-actor-email') || undefined
				const actorName = request.headers.get('x-actor-name') || undefined

				const updatedOrder = await OrdersService.updateOrder(
					Number(params.id),
					{
						...body,
						total: (body as any).total !== undefined ? parseNumberLike((body as any).total, 'total') : undefined,
					} as any,
					{
						userId: null,
						ipAddress: ipAddress ? String(ipAddress) : undefined,
						userAgent: userAgent ? String(userAgent) : undefined,
						actorEmail: actorEmail ? String(actorEmail) : undefined,
						actorName: actorName ? String(actorName) : undefined,
					}
				)
				return updatedOrder
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: t.Object({
				customerId: t.Optional(t.Number()),
				status: t.Optional(t.Union([
					t.Literal('pending'),
					t.Literal('processing'),
					t.Literal('shipped'),
					t.Literal('delivered'),
					t.Literal('cancelled')
				])),
				total: t.Optional(t.Union([t.Number(), t.String()])),
			}),
			detail: {
				tags: ['orders'],
				summary: 'Actualizar una orden',
			},
		}
	)
	/**
	 * DELETE /orders/:id - Eliminar una orden
	 */
	.delete(
		'/:id',
		async ({ params, request }) => {
			try {
				const ipAddress =
					request.headers.get('x-forwarded-for') ||
					request.headers.get('x-real-ip') ||
					undefined
				const userAgent = request.headers.get('user-agent') || undefined
				const actorEmail = request.headers.get('x-actor-email') || undefined
				const actorName = request.headers.get('x-actor-name') || undefined

				const result = await OrdersService.deleteOrder(Number(params.id), {
					userId: null,
					ipAddress: ipAddress ? String(ipAddress) : undefined,
					userAgent: userAgent ? String(userAgent) : undefined,
					actorEmail: actorEmail ? String(actorEmail) : undefined,
					actorName: actorName ? String(actorName) : undefined,
				})
				return {
					message: 'Orden eliminada exitosamente',
					order: result.order
				}
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			detail: {
				tags: ['orders'],
				summary: 'Eliminar una orden',
			},
		}
	)
	/**
	 * PUT /orders/:id/status - Cambiar status y guardar timeline
	 */
	.put(
		'/:id/status',
		async ({ params, body, request }) => {
			try {
				const ipAddress =
					request.headers.get('x-forwarded-for') ||
					request.headers.get('x-real-ip') ||
					undefined
				const userAgent = request.headers.get('user-agent') || undefined
				const actorEmail = request.headers.get('x-actor-email') || undefined
				const actorName = request.headers.get('x-actor-name') || undefined

				return await OrdersService.updateOrderStatus(
					Number(params.id),
					body.toStatus,
					body.reason,
					{
						userId: null,
						ipAddress: ipAddress ? String(ipAddress) : undefined,
						userAgent: userAgent ? String(userAgent) : undefined,
						actorEmail: actorEmail ? String(actorEmail) : undefined,
						actorName: actorName ? String(actorName) : undefined,
					}
				)
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: t.Object({
				toStatus: t.Union([
					t.Literal('pending'),
					t.Literal('processing'),
					t.Literal('shipped'),
					t.Literal('delivered'),
					t.Literal('cancelled')
				]),
				reason: t.Optional(t.String()),
			}),
			detail: {
				tags: ['orders'],
				summary: 'Cambiar status de una orden',
			},
		}
	)
	/**
	 * POST /orders/:id/payments - Registrar pago manual (transferencia)
	 */
	.post(
		'/:id/payments',
		async ({ params, body, request }) => {
			try {
				const ipAddress =
					request.headers.get('x-forwarded-for') ||
					request.headers.get('x-real-ip') ||
					undefined
				const userAgent = request.headers.get('user-agent') || undefined
				const actorEmail = request.headers.get('x-actor-email') || undefined
				const actorName = request.headers.get('x-actor-name') || undefined

				return await OrdersService.addPayment(
					Number(params.id),
					{
						...body,
						amount: parseNumberLike((body as any).amount, 'amount'),
					} as any,
					{
						userId: null,
						ipAddress: ipAddress ? String(ipAddress) : undefined,
						userAgent: userAgent ? String(userAgent) : undefined,
						actorEmail: actorEmail ? String(actorEmail) : undefined,
						actorName: actorName ? String(actorName) : undefined,
					}
				)
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: t.Object({
				amount: t.Union([t.Number(), t.String()]),
				reference: t.Optional(t.String()),
				proofUrl: t.Optional(t.String()),
				notes: t.Optional(t.String()),
				paidAt: t.Optional(t.String()),
			}),
			detail: {
				tags: ['orders'],
				summary: 'Registrar pago manual para una orden',
			},
		}
	)
	.compile()

