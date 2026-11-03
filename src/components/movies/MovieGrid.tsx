'use client';

import React from 'react';
import { ITMDBMovie } from '@/lib/types';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  title: string;
  movies: ITMDBMovie[];
}

export function MovieGrid({ title, movies }: MovieGridProps) {
  if (!movies || movies.length === 0) return null;

  return (
    <section className="container" style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          {title}
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {movies.length} titles
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '20px',
        }}
      >
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
export default MovieGrid;

