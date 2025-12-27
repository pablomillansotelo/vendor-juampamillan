import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/rate-limit-helper';

const VENDOR_API_URL = process.env.VENDOR_API_URL || 'http://localhost:8000';
const VENDOR_API_KEY = process.env.VENDOR_API_KEY || '';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

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
    // Cambiar a external-products (solo lectura desde Inventory)
    const url = new URL(`${VENDOR_API_URL}/v1/external-products`);
    
    // Pasar todos los query params
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': VENDOR_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al obtener productos externos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    nextResponse.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return addRateLimitHeaders(nextResponse, rateLimitResult);
  } catch (error: any) {
    console.error('Error en GET /api/vendor/products:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener productos externos' },
      { status: 500 }
    );
  }
}

