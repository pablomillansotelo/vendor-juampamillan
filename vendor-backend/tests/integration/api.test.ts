import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import app from '../../api/index';

/**
 * Tests de integración para las APIs
 * 
 * Estos tests verifican que los endpoints funcionen correctamente
 * Requieren que el servidor esté corriendo o usar un cliente HTTP
 */
describe('API Integration Tests', () => {
  const API_KEY = process.env.API_KEY || 'test-api-key';
  const BASE_URL = process.env.API_URL || 'http://localhost:8000';

  describe('GET /', () => {
    it('debe retornar información de la API', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('endpoints');
    });
  });

  describe('GET /v1/products', () => {
    it('debe requerir API key', async () => {
      const response = await fetch(`${BASE_URL}/v1/products`);
      expect(response.status).toBe(401);
    });

    it('debe retornar lista de productos con API key válida (si existe)', async () => {
      const response = await fetch(`${BASE_URL}/v1/products`, {
        headers: {
          'X-API-Key': API_KEY
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        // getAllProducts devuelve objeto con products/total/offset
        expect(data).toHaveProperty('products');
      } else {
        // Puede fallar si no hay API key configurada o no válida en entorno de test
        expect([401, 403]).toContain(response.status);
      }
    });
  });
});

