import { NextResponse } from 'next/server';
import { getMoviesCollection, getSeriesCollection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [moviesCol, seriesCol] = await Promise.all([
      getMoviesCollection(),
      getSeriesCollection(),
    ]);
    const [movies, series] = await Promise.all([
      moviesCol.estimatedDocumentCount().catch(() => 0),
      seriesCol.estimatedDocumentCount().catch(() => 0),
    ]);
    return NextResponse.json({
      movies,
      series,
      total: movies + series,
    });
  } catch {
    return NextResponse.json({ movies: 0, series: 0, total: 0 });
  }
}

