import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/rate-limit-helper';

const INVENTORY_API_URL = process.env.INVENTORY_API_URL || 'http://localhost:8000';
const INVENTORY_API_KEY = process.env.INVENTORY_API_KEY || '';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { response: rateLimitResponse, rateLimitResult } = await applyRateLimit(request, 'get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const url = new URL(`${INVENTORY_API_URL}/v1/stock-levels`);
    
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INVENTORY_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al obtener niveles de stock' },
        { status: response.status }
      );
    }

    const backendData = await response.json();
    // El backend ya devuelve { data: [...] }, no necesitamos envolverlo de nuevo
    const nextResponse = NextResponse.json(backendData);
    nextResponse.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return addRateLimitHeaders(nextResponse, rateLimitResult);
  } catch (error: any) {
    console.error('Error en GET /api/inventory/v1/stock-levels:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener niveles de stock' },
      { status: 500 }
    );
  }
}

