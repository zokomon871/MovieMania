import { NextRequest, NextResponse } from 'next/server';
import { getMovieStreamUrls } from '@/lib/mediaUtils';
import { getMovieByIdFromDb } from '@/lib/movieService';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const movie = await getMovieByIdFromDb(params.id);
  const urls = getMovieStreamUrls(params.id, movie?.tmdbId);
  return NextResponse.json({ url: urls.vidsrc, sources: urls });
}
