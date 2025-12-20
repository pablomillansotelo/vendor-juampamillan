import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/rate-limit-helper';

export const revalidate = 30;

const PERMIT_API_URL = process.env.PERMIT_API_URL || 'http://localhost:8000';
const PERMIT_API_KEY = process.env.PERMIT_API_KEY || '';

function buildTargetUrl(request: NextRequest, pathParts: string[] | undefined) {
  const suffix = pathParts && pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
  const search = request.nextUrl.search ? request.nextUrl.search : '';
  return `${PERMIT_API_URL}/v1/notifications${suffix}${search}`;
}

async function forward(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { response: rateLimitResponse, rateLimitResult } = await applyRateLimit(
    request,
    request.method === 'GET' ? 'get' : 'mutation'
  );
  if (rateLimitResponse) return rateLimitResponse;

  if (!PERMIT_API_KEY) {
    return NextResponse.json(
      { error: 'PERMIT_API_KEY no configurada en vendor-frontend' },
      { status: 500 }
    );
  }

  const params = await context.params;
  const targetUrl = buildTargetUrl(request, params.path);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  const res = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      'X-API-Key': PERMIT_API_KEY,
    },
    body,
  });

  const contentType = res.headers.get('content-type') || '';
  let payload: any = null;
  try {
    if (contentType.includes('application/json')) payload = await res.json();
    else payload = await res.text();
  } catch {
    payload = null;
  }

  const response =
    contentType.includes('application/json')
      ? NextResponse.json(payload, { status: res.status })
      : new NextResponse(payload, { status: res.status });

  return addRateLimitHeaders(response, rateLimitResult);
}

export async function GET(request: NextRequest, context: any) {
  try {
    return await forward(request, context);
  } catch (error: any) {
    console.error('Error en GET /api/permit/v1/notifications/*:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: any) {
  try {
    return await forward(request, context);
  } catch (error: any) {
    console.error('Error en POST /api/permit/v1/notifications/*:', error);
    return NextResponse.json(
      { error: error.message || 'Error en notificaciones' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    return await forward(request, context);
  } catch (error: any) {
    console.error('Error en PUT /api/permit/v1/notifications/*:', error);
    return NextResponse.json(
      { error: error.message || 'Error en notificaciones' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    return await forward(request, context);
  } catch (error: any) {
    console.error('Error en DELETE /api/permit/v1/notifications/*:', error);
    return NextResponse.json(
      { error: error.message || 'Error en notificaciones' },
      { status: 500 }
    );
  }
}


