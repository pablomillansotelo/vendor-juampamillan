import { Elysia, t } from 'elysia'
import { ProductsService } from './service.js'

function parseNumberLike(value: unknown, fieldName: string): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value
	if (typeof value === 'string') {
		const n = Number(value)
		if (Number.isFinite(n)) return n
	}
	throw new Error(`Campo inválido: ${fieldName} debe ser numérico`)
}

export const productsRouter = new Elysia({ prefix: '/products' })
	/**
	 * GET /products - Obtener todos los productos con filtros opcionales
	 */
	.get(
		'/',
		async ({ query }) => {
			try {
				const filters: any = {}
				const queryParams = query as any
				if (queryParams?.status) filters.status = queryParams.status
				if (queryParams?.q) filters.search = queryParams.q
				if (queryParams?.offset) filters.offset = Number(queryParams.offset)
				if (queryParams?.limit) filters.limit = Number(queryParams.limit)
				
				const result = await ProductsService.getAllProducts(Object.keys(filters).length > 0 ? filters : undefined)
				return result
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			query: t.Object({
				status: t.Optional(t.Union([t.Literal('active'), t.Literal('inactive'), t.Literal('archived')])),
				q: t.Optional(t.String()),
				offset: t.Optional(t.String()),
				limit: t.Optional(t.String()),
			}),
			detail: {
				tags: ['products'],
				summary: 'Obtener todos los productos con filtros opcionales',
			},
		}
	)
	/**
	 * GET /products/:id - Obtener un producto por ID
	 */
	.get(
		'/:id',
		async ({ params }) => {
			try {
				const product = await ProductsService.getProductById(Number(params.id))
				return product
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			detail: {
				tags: ['products'],
				summary: 'Obtener un producto por ID',
			},
		}
	)
	/**
	 * POST /products - Crear un nuevo producto
	 */
	.post(
		'/',
		async ({ body, request }) => {
			try {
				// (Futuro) pasar actor desde headers; por ahora audit es best-effort sin userId
				const newProduct = await ProductsService.createProduct({
					...body,
					price: parseNumberLike((body as any).price, 'price'),
					stock: (body as any).stock !== undefined ? parseNumberLike((body as any).stock, 'stock') : undefined,
				} as any)
				return newProduct
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: t.Object({
				imageUrl: t.String(),
				name: t.String(),
				status: t.Optional(t.Union([t.Literal('active'), t.Literal('inactive'), t.Literal('archived')])),
				price: t.Union([t.Number(), t.String()]),
				stock: t.Optional(t.Union([t.Number(), t.String()])),
				availableAt: t.Optional(t.String()),
			}),
			detail: {
				tags: ['products'],
				summary: 'Crear un nuevo producto',
			},
		}
	)
	/**
	 * PUT /products/:id - Actualizar un producto
	 */
	.put(
		'/:id',
		async ({ params, body, request }) => {
			try {
				const updatedProduct = await ProductsService.updateProduct(
					Number(params.id),
					{
						...body,
						price:
							(body as any).price !== undefined
								? parseNumberLike((body as any).price, 'price')
								: undefined,
						stock:
							(body as any).stock !== undefined
								? parseNumberLike((body as any).stock, 'stock')
								: undefined,
					} as any
				)
				return updatedProduct
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: t.Object({
				imageUrl: t.Optional(t.String()),
				name: t.Optional(t.String()),
				status: t.Optional(t.Union([t.Literal('active'), t.Literal('inactive'), t.Literal('archived')])),
				price: t.Optional(t.Union([t.Number(), t.String()])),
				stock: t.Optional(t.Union([t.Number(), t.String()])),
				availableAt: t.Optional(t.String()),
			}),
			detail: {
				tags: ['products'],
				summary: 'Actualizar un producto',
			},
		}
	)
	/**
	 * DELETE /products/:id - Eliminar un producto
	 */
	.delete(
		'/:id',
		async ({ params, request }) => {
			try {
				const deletedProduct = await ProductsService.deleteProduct(Number(params.id))
				return {
					message: 'Producto eliminado exitosamente',
					product: deletedProduct
				}
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			detail: {
				tags: ['products'],
				summary: 'Eliminar un producto',
			},
		}
	)
	.compile()

