import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { usersApi } from '@/lib/api-server';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/rate-limit-helper';

// Cache por 60 segundos para mejorar performance
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Rate limiting
    const { response: rateLimitResponse, rateLimitResult } = await applyRateLimit(request, 'get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const users = await usersApi.getAll();
    const response = NextResponse.json(users);
    
    // Headers de cache
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error: any) {
    console.error('Error en GET /api/permit/users:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuarios' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Rate limiting (más restrictivo para mutaciones)
    const { response: rateLimitResponse, rateLimitResult } = await applyRateLimit(request, 'mutation');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const user = await usersApi.create(body);
    const response = NextResponse.json(user, { status: 201 });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error: any) {
    console.error('Error en POST /api/permit/users:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: error.status || 500 }
    );
  }
}

