'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Play, Plus, Check } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { getImageUrl, formatRating, formatYear, FALLBACK_POSTER } from '@/lib/mediaUtils';
import { useFavorites } from '@/hooks/useFavorites';

interface MovieCardProps {
  movie: ITMDBMovie;
  rank?: number;
  onSelect?: (movie: ITMDBMovie) => void;
}

export function MovieCard({ movie, rank, onSelect }: MovieCardProps) {
  const poster = getImageUrl(movie.poster_path);
  const year = formatYear(movie.release_date);
  const { isFavorite, toggleFavorite } = useFavorites();
  const id = String(movie.id);
  const inList = isFavorite(id);

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(movie);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Link href={`/movies/${movie.id}`} onClick={handleClick} className="movie-card-item" style={{ textDecoration: 'none' }}>
        <div className="movie-poster-box">
          <img
            src={poster}
            alt={movie.title}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_POSTER) {
                e.currentTarget.src = FALLBACK_POSTER;
              }
            }}
          />

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
              {formatRating(movie.vote_average)}
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) =>
          toggleFavorite({
            id,
            type: 'movie',
            title: movie.title,
            poster: movie.poster_path,
            backdrop: movie.backdrop_path,
            rating: movie.vote_average,
            year,
          }, e)
        }
        className={`card-favorite-btn ${inList ? 'active' : ''}`}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 5,
          background: 'rgba(0,0,0,0.65)',
          borderRadius: '50%',
          padding: '6px',
        }}
        title={inList ? 'In My List' : 'Add to My List'}
      >
        {inList ? <Check size={14} color="var(--accent)" /> : <Plus size={14} color="#fff" />}
      </button>
    </div>
  );
}

export default MovieCard;
