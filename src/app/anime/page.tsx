import React from 'react';
import { searchMovies } from '@/lib/tmdb';
import { searchSeries } from '@/lib/seriesService';
import { AnimeExplorer } from '@/components/anime/AnimeExplorer';

export const revalidate = 3600;

export default async function AnimePage() {
  const [animeMovies, animeSeries] = await Promise.all([
    searchMovies('', 'Animation', 'rating', 0, 1),
    searchSeries('', 'Animation', 'rating', 0, 1),
  ]);

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container" style={{ paddingTop: '20px' }}>
        <AnimeExplorer initialMovies={animeMovies} initialSeries={animeSeries} />
      </div>
    </main>
  );
}
