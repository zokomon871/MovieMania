import React from 'react';
import { getTrendingMovies, getPopularMovies } from '@/lib/tmdb';
import { MoviesExplorer } from '@/components/movies/MoviesExplorer';

export const revalidate = 3600;

export default async function MoviesPage() {
  const [trending, popular] = await Promise.all([getTrendingMovies(), getPopularMovies()]);
  const heroMovie = trending[0] || popular[0];

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container" style={{ paddingTop: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
            VOD Cinema
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0 }}>
            Search blockbusters or filter by genre to stream on-demand in full HD.
          </p>
        </div>

        <MoviesExplorer heroMovie={heroMovie} initialTrending={trending} initialPopular={popular} />
      </div>
    </main>
  );
}
