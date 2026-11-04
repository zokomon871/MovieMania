'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Play } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { getImageUrl } from '@/lib/mediaUtils';

export function MovieCard({ movie }: { movie: ITMDBMovie }) {
  const poster = getImageUrl(movie.poster_path);
  const year = movie.release_date?.substring(0, 4) || '';

  return (
    <Link href={`/movies/${movie.id}`} className="movie-card-item" style={{ textDecoration: 'none' }}>
      <div className="movie-poster-box" style={{ position: 'relative', width: '100%', aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-surface)' }}>
        <img src={poster} alt={movie.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className="movie-card-overlay">
          <div className="movie-play-btn">
            <Play size={20} fill="#fff" />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {movie.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>{year}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent)', fontWeight: 600 }}>
            <Star size={12} fill="var(--accent)" />
            {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}
          </span>
        </div>
      </div>
    </Link>
  );
}
export default MovieCard;

