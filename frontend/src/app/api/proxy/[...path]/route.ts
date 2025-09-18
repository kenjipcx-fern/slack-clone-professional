import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://backend-api-morphvm-hy4i6u97.http.cloud.morph.so';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'PATCH');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    
    const targetUrl = `${BACKEND_URL}/${pathString}${queryString}`;
    
    // Get request body if present
    let body: string | null = null;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const requestBody = await request.text();
        body = requestBody || null;
      } catch (error) {
        body = null;
      }
    }

    // Forward headers (excluding host and other problematic headers)
    const forwardedHeaders: HeadersInit = {};
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        !lowerKey.startsWith('host') &&
        !lowerKey.startsWith('x-forwarded') &&
        lowerKey !== 'connection' &&
        lowerKey !== 'upgrade'
      ) {
        forwardedHeaders[key] = value;
      }
    });

    // Make request to backend
    const response = await fetch(targetUrl, {
      method,
      headers: {
        ...forwardedHeaders,
        'Content-Type': 'application/json',
      },
      ...(body && { body }),
    });

    // Get response data
    const responseData = await response.text();
    
    // Create new response with proper CORS headers
    const newResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy response headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        newResponse.headers.set(key, value);
      }
    });

    // Add CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'PROXY_ERROR', 
          message: 'Failed to proxy request to backend' 
        } 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
