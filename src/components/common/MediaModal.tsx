'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Play, Star, Calendar, Layers, Plus, Check } from 'lucide-react';
import { ITMDBMovie, ISeries } from '@/lib/types';
import { getImageUrl } from '@/lib/mediaUtils';
import { useFavorites } from '@/hooks/useFavorites';

interface MediaModalProps {
  item: ITMDBMovie | ISeries | null;
  type: 'movie' | 'series';
  isOpen: boolean;
  onClose: () => void;
}

export function MediaModal({ item, type, isOpen, onClose }: MediaModalProps) {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isMovie = type === 'movie';
  const movie = item as ITMDBMovie;
  const series = item as ISeries;

  const id = item.id.toString();
  const title = isMovie ? movie.title : series.title;
  const rating = isMovie ? movie.vote_average : series.rating;
  const year = isMovie ? movie.release_date?.substring(0, 4) : series.year;
  const backdrop = isMovie
    ? getImageUrl(movie.backdrop_path || movie.poster_path, 'original')
    : getImageUrl(series.backdrop || series.poster || null, 'original');
  const overview = isMovie ? movie.overview : series.overview;
  const playHref = isMovie ? `/movies/${movie.id}` : `/series/${series.id}`;
  const isInList = isFavorite(id);
  const matchPercent = Math.min(99, Math.round((rating || 7.5) * 10));

  return (
    <div className="media-modal-backdrop" onClick={onClose}>
      <div className="media-modal-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="media-modal-close-btn" aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="media-modal-hero" style={{ backgroundImage: `url(${backdrop})` }}>
          <div className="media-modal-hero-gradient" />
          <div className="media-modal-hero-content">
            <h2 className="media-modal-title">{title}</h2>
            <div className="media-modal-actions">
              <Link href={playHref} className="media-modal-play-btn">
                <Play size={18} fill="currentColor" /> Play Now
              </Link>
              <button
                type="button"
                onClick={(e) => toggleFavorite(id, e)}
                className={`media-modal-list-btn ${isInList ? 'in-list' : ''}`}
                title={isInList ? 'Remove from My List' : 'Add to My List'}
              >
                {isInList ? <Check size={18} /> : <Plus size={18} />}
                <span>{isInList ? 'In My List' : 'My List'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="media-modal-body">
          <div className="media-modal-meta-row">
            <span className="media-modal-match">{matchPercent}% Match</span>
            <div className="media-modal-rating">
              <Star size={15} fill="var(--accent)" /> {rating ? rating.toFixed(1) : 'NR'}
            </div>
            <div className="media-modal-year">
              <Calendar size={14} /> {year || 'N/A'}
            </div>
            {!isMovie && series.seasonsCount && (
              <div className="media-modal-seasons">
                <Layers size={14} /> {series.seasonsCount} Season{series.seasonsCount > 1 ? 's' : ''}
              </div>
            )}
            <span className="media-modal-badge">
              {isMovie ? '1080p FHD' : 'HD TV'}
            </span>
          </div>

          <p className="media-modal-overview">
            {overview || 'No synopsis available for this title.'}
          </p>

          <div className="media-modal-footer">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Streaming Sources: VidSrc & VidLink
            </span>
            <Link href={playHref} className="media-modal-full-link">
              Launch Full Player →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaModal;
