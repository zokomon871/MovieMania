'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Calendar } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { getImageUrl } from '@/lib/mediaUtils';

export function MovieHero({ movie }: { movie: ITMDBMovie }) {
  if (!movie) return null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '420px',
        borderRadius: '24px',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(to right, rgba(7,7,9,0.95) 20%, rgba(7,7,9,0.4) 60%, transparent 100%), url(${getImageUrl(movie.backdrop_path || movie.poster_path, 'original')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        padding: '40px',
        marginBottom: '48px',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: '580px', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '16px' }}>
          FEATURED BLOCKBUSTER
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '12px' }}>
          {movie.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontWeight: 700 }}>
            <Star size={16} fill="var(--accent)" /> {movie.vote_average?.toFixed(1) || 'NR'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} /> {movie.release_date?.substring(0, 4)}
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {movie.overview}
        </p>

        <Link
          href={`/movies/${movie.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: '10px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <Play size={18} fill="#fff" /> Watch Movie Free
        </Link>
      </div>
    </div>
  );
}
export default MovieHero;

