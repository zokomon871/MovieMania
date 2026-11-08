'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Play } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { getImageUrl } from '@/lib/mediaUtils';

interface MovieCardProps {
  movie: ITMDBMovie;
  rank?: number;
  onSelect?: (movie: ITMDBMovie) => void;
}

export function MovieCard({ movie, rank, onSelect }: MovieCardProps) {
  const poster = getImageUrl(movie.poster_path);
  const year = movie.release_date?.substring(0, 4) || '';

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(movie);
    }
  };

  return (
    <Link href={`/movies/${movie.id}`} onClick={handleClick} className="movie-card-item" style={{ textDecoration: 'none' }}>
      <div className="movie-poster-box">
        <img src={poster} alt={movie.title} loading="lazy" />

        {rank !== undefined && (
          <div className="media-rank-badge">
            #{rank}
          </div>
        )}

        <div className="media-hd-pill">HD</div>

        <div className="movie-card-overlay">
          <div className="movie-play-btn">
            <Play size={20} fill="#fff" />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <h4 className="media-card-title" title={movie.title}>
          {movie.title}
        </h4>
        <div className="media-card-meta">
          <span>{year}</span>
          <span className="media-card-rating">
            <Star size={12} fill="var(--accent)" />
            {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
