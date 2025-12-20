import { Elysia, t } from 'elysia'
import { ApiKeysService } from './service.js'
import { ApiKeysModel } from './model.js'

export const apiKeys = new Elysia({ prefix: '/api-keys' })
	.get(
		'/',
		async () => {
			try {
				const allKeys = await ApiKeysService.getAllApiKeys()
				return allKeys
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			response: ApiKeysModel.apiKeysList,
			detail: {
				tags: ['api-keys'],
				summary: 'Listar todas las API keys',
				description: 'Obtiene todas las API keys del sistema (sin exponer los hashes)',
			},
		}
	)
	.get(
		'/:id',
		async ({ params }) => {
			try {
				const allKeys = await ApiKeysService.getAllApiKeys()
				const key = allKeys.find(k => k.id === Number(params.id))
				if (!key) {
					throw new Error('API key no encontrada')
				}
				return key
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			params: t.Object({
				id: t.Numeric(),
			}),
			response: ApiKeysModel.apiKeyResponse,
			detail: {
				tags: ['api-keys'],
				summary: 'Obtener una API key por ID',
			},
		}
	)
	.post(
		'/',
		async ({ body }) => {
			try {
				const result = await ApiKeysService.createApiKey({
					name: body.name,
					scopes: body.scopes,
					rateLimit: body.rateLimit,
					expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
					createdBy: body.createdBy,
				})
				return result
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			body: ApiKeysModel.createBody,
			response: ApiKeysModel.apiKeyWithKey,
			detail: {
				tags: ['api-keys'],
				summary: 'Crear una nueva API key',
				description: 'Crea una nueva API key y retorna la key en texto plano (solo se muestra una vez)',
			},
		}
	)
	.put(
		'/:id',
		async ({ params, body }) => {
			try {
				const result = await ApiKeysService.updateApiKey(Number(params.id), {
					name: body.name,
					scopes: body.scopes,
					rateLimit: body.rateLimit,
					expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
					isActive: body.isActive,
				})
				return result
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			params: t.Object({
				id: t.Numeric(),
			}),
			body: ApiKeysModel.updateBody,
			response: ApiKeysModel.apiKeyResponse,
			detail: {
				tags: ['api-keys'],
				summary: 'Actualizar una API key',
			},
		}
	)
	.delete(
		'/:id',
		async ({ params }) => {
			try {
				const result = await ApiKeysService.revokeApiKey(Number(params.id))
				return { message: 'API key revocada exitosamente', apiKey: result }
			} catch (error: any) {
				throw new Error(error.message)
			}
		},
		{
			params: t.Object({
				id: t.Numeric(),
			}),
			detail: {
				tags: ['api-keys'],
				summary: 'Revocar una API key',
				description: 'Marca una API key como revocada (isActive = "revoked")',
			},
		}
	)

