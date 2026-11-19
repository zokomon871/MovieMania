'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Play, Layers, Plus, Check } from 'lucide-react';
import { ISeries } from '@/lib/types';
import { getImageUrl, formatRating, FALLBACK_POSTER } from '@/lib/mediaUtils';
import { useFavorites } from '@/hooks/useFavorites';

interface SeriesCardProps {
  series: ISeries;
  rank?: number;
  onSelect?: (series: ISeries) => void;
}

export function SeriesCard({ series, rank, onSelect }: SeriesCardProps) {
  const poster = getImageUrl(series.poster || series.backdrop || null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const id = String(series.id);
  const inList = isFavorite(id);

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(series);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Link
        href={`/series/${series.id}`}
        prefetch={true}
        onClick={handleClick}
        className="movie-card-item"
        style={{ textDecoration: 'none' }}
      >
        <div className="movie-poster-box">
          <img
            src={poster}
            alt={series.title}
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

          {series.seasonsCount && series.seasonsCount > 1 ? (
            <div className="media-season-pill">
              <Layers size={11} color="var(--accent)" />
              {series.seasonsCount} S
            </div>
          ) : (
            <div className="media-hd-pill">TV</div>
          )}

          <div className="movie-card-overlay">
            <div className="movie-play-btn">
              <Play size={20} fill="#fff" />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '8px' }}>
          <h4 className="media-card-title" title={series.title}>
            {series.title}
          </h4>
          <div className="media-card-meta">
            <span>{series.year || 'Series'}</span>
            <span className="media-card-rating">
              <Star size={12} fill="var(--accent)" />
              {formatRating(series.rating)}
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) =>
          toggleFavorite({
            id,
            type: 'series',
            title: series.title,
            poster: series.poster,
            backdrop: series.backdrop,
            rating: series.rating,
            year: series.year,
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

export default SeriesCard;
