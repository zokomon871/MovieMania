import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const backendUrl = `http://localhost:5000/api/categories?${searchParams.toString()}`;

    const response = await fetch(backendUrl, { cache: 'no-store' });
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Categories API Proxy Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message, categories: [] },
      { status: 500 }
    );
  }
}
