import { NextRequest, NextResponse } from 'next/server';
import { getStreamEmbedUrl } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const url = getStreamEmbedUrl(params.id);
  return NextResponse.json({ url });
}

