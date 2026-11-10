'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Calendar, Info } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { getImageUrl, formatRating, formatYear } from '@/lib/mediaUtils';

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
            <Star size={16} fill="var(--accent)" /> {formatRating(movie.vote_average)}
          </span>
          <span className="movie-hero-year">
            <Calendar size={14} /> {formatYear(movie.release_date)}
          </span>
          <span className="media-modal-badge" style={{ marginLeft: '4px' }}>
            1080p FHD
          </span>
        </div>

        <p className="movie-hero-overview">
          {movie.overview}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link href={`/movies/${movie.id}`} className="movie-hero-btn">
            <Play size={18} fill="currentColor" /> Watch Movie Free
          </Link>
          <Link href={`/movies/${movie.id}`} className="movie-hero-btn-secondary">
            <Info size={18} /> Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MovieHero;
