'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Calendar } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { getImageUrl } from '@/lib/mediaUtils';

export function MovieHero({ movie }: { movie: ITMDBMovie }) {
  if (!movie) return null;
  const backdropUrl = getImageUrl(movie.backdrop_path || movie.poster_path, 'original');

  return (
    <div
      className="movie-hero-banner"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(7,7,9,0.95) 20%, rgba(7,7,9,0.4) 60%, transparent 100%), url(${backdropUrl})`,
      }}
    >
      <div className="movie-hero-content">
        <div className="movie-hero-badge">
          FEATURED BLOCKBUSTER
        </div>

        <h1 className="movie-hero-title">
          {movie.title}
        </h1>

        <div className="movie-hero-meta">
          <span className="movie-hero-rating">
            <Star size={16} fill="var(--accent)" /> {movie.vote_average?.toFixed(1) || 'NR'}
          </span>
          <span className="movie-hero-year">
            <Calendar size={14} /> {movie.release_date?.substring(0, 4)}
          </span>
        </div>

        <p className="movie-hero-overview">
          {movie.overview}
        </p>

        <Link href={`/movies/${movie.id}`} className="movie-hero-btn">
          <Play size={18} fill="#fff" /> Watch Movie Free
        </Link>
      </div>
    </div>
  );
}

export default MovieHero;
