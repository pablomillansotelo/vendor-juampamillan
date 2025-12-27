import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/rate-limit-helper';

const INVENTORY_API_URL = process.env.INVENTORY_API_URL || 'http://localhost:8000';
const INVENTORY_API_KEY = process.env.INVENTORY_API_KEY || '';

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
    const url = new URL(`${INVENTORY_API_URL}/v1/external-products`);
    
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
        { error: errorData.message || 'Error al obtener productos externos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    nextResponse.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return addRateLimitHeaders(nextResponse, rateLimitResult);
  } catch (error: any) {
    console.error('Error en GET /api/inventory/v1/external-products:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener productos externos' },
      { status: 500 }
    );
  }
}

