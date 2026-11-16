import React from 'react';
import { getTrendingMovies, getPopularMovies } from '@/lib/tmdb';
import { MoviesExplorer } from '@/components/movies/MoviesExplorer';

export const revalidate = 3600;

export default async function MoviesPage() {
  const [trending, popular] = await Promise.all([getTrendingMovies(), getPopularMovies()]);
  const heroMovie = trending[0] || popular[0];

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container" style={{ paddingTop: '20px' }}>
        <MoviesExplorer heroMovie={heroMovie} initialTrending={trending} initialPopular={popular} />
      </div>
    </main>
  );
}
