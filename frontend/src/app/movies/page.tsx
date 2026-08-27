import React from 'react';
import { fetchTrendingMovies, fetchPopularMovies } from '@/lib/tmdb';
import MovieGrid from '@/components/MovieGrid';

export default async function MoviesPage() {
  const trendingMovies = await fetchTrendingMovies();
  const popularMovies = await fetchPopularMovies();

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container" style={{ paddingTop: '40px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, transparent 100%)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', marginBottom: '16px', letterSpacing: '-1px' }}>
            VOD Cinema
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', lineHeight: 1.6 }}>
            Browse a massive library of on-demand movies powered by the TMDb API and vidsrc.me streaming embed.
          </p>
        </div>
      </div>

      <MovieGrid title="Trending Today" movies={trendingMovies} />
      <MovieGrid title="Popular Right Now" movies={popularMovies} />
    </main>
  );
}
