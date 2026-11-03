import React from 'react';
import { getTrendingMovies, getPopularMovies } from '@/lib/tmdb';
import { MovieHero } from '@/components/movies/MovieHero';
import { MovieGrid } from '@/components/movies/MovieGrid';

export const revalidate = 3600;

export default async function MoviesPage() {
  const [trending, popular] = await Promise.all([getTrendingMovies(), getPopularMovies()]);
  const heroMovie = trending[0] || popular[0];

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container" style={{ paddingTop: '32px' }}>
        {heroMovie && <MovieHero movie={heroMovie} />}

        <div style={{ background: 'linear-gradient(135deg, var(--accent-muted) 0%, transparent 100%)', padding: '32px', borderRadius: '20px', border: '1px solid var(--accent-glow)', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
            VOD Cinema
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6, margin: 0 }}>
            Discover trending blockbusters and stream movies directly on-demand in full HD.
          </p>
        </div>
      </div>

      <MovieGrid title="Trending Today" movies={trending} />
      <MovieGrid title="Popular Right Now" movies={popular} />
    </main>
  );
}

