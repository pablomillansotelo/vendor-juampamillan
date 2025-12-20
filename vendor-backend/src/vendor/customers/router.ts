import { Elysia, t } from 'elysia'
import { CustomersService } from './service.js'

export const customersRouter = new Elysia({ prefix: '/customers' })
	/**
	 * GET /customers - Obtener todos los clientes
	 */
	.get(
		'/',
		async () => {
			try {
				const allCustomers = await CustomersService.getAllCustomers()
				return allCustomers
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			detail: {
				tags: ['customers'],
				summary: 'Obtener todos los clientes',
			},
		}
	)
	/**
	 * GET /customers/:id - Obtener un cliente por ID
	 */
	.get(
		'/:id',
		async ({ params }) => {
			try {
				const customer = await CustomersService.getCustomerById(Number(params.id))
				return customer
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			detail: {
				tags: ['customers'],
				summary: 'Obtener un cliente por ID',
			},
		}
	)
	/**
	 * POST /customers - Crear un nuevo cliente
	 */
	.post(
		'/',
		async ({ body, request }) => {
			try {
				const newCustomer = await CustomersService.createCustomer(body)
				return newCustomer
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: t.Object({
				name: t.String(),
				email: t.String(),
				phone: t.Optional(t.String()),
				address: t.Optional(t.String()),
			}),
			detail: {
				tags: ['customers'],
				summary: 'Crear un nuevo cliente',
			},
		}
	)
	/**
	 * PUT /customers/:id - Actualizar un cliente
	 */
	.put(
		'/:id',
		async ({ params, body, request }) => {
			try {
				const updatedCustomer = await CustomersService.updateCustomer(
					Number(params.id),
					body
				)
				return updatedCustomer
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: t.Object({
				name: t.Optional(t.String()),
				email: t.Optional(t.String()),
				phone: t.Optional(t.String()),
				address: t.Optional(t.String()),
			}),
			detail: {
				tags: ['customers'],
				summary: 'Actualizar un cliente',
			},
		}
	)
	/**
	 * DELETE /customers/:id - Eliminar un cliente
	 */
	.delete(
		'/:id',
		async ({ params, request }) => {
			try {
				const deletedCustomer = await CustomersService.deleteCustomer(Number(params.id))
				return {
					message: 'Cliente eliminado exitosamente',
					customer: deletedCustomer
				}
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			detail: {
				tags: ['customers'],
				summary: 'Eliminar un cliente',
			},
		}
	)
	.compile()

