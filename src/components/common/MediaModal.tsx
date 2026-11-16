'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Play, Star, Calendar, Layers, Plus, Check, Film, Tv, Sparkles, Volume2 } from 'lucide-react';
import { ITMDBMovie, ISeries } from '@/lib/types';
import { getImageUrl, formatRating, formatYear } from '@/lib/mediaUtils';
import { useFavorites } from '@/hooks/useFavorites';

interface MediaModalProps {
  item: ITMDBMovie | ISeries | any | null;
  type?: 'movie' | 'series' | 'channel';
  isOpen: boolean;
  onClose: () => void;
}

export function MediaModal({ item, type = 'movie', isOpen, onClose }: MediaModalProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [selectedSeason, setSelectedSeason] = useState(1);

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

  const isMovie = (item.type || type) === 'movie';
  const movie = item as ITMDBMovie;
  const series = item as ISeries;

  const id = String(item.id);
  const title = item.title || movie.title || series.title || 'Untitled';
  const rawRating = isMovie ? movie.vote_average : series.rating;
  const ratingText = formatRating(rawRating);
  const numRating = typeof rawRating === 'number' ? rawRating : parseFloat(String(rawRating || 7.5)) || 7.5;
  const yearText = formatYear(isMovie ? movie.release_date : series.year);
  const backdrop = isMovie
    ? getImageUrl(movie.backdrop_path || movie.poster_path, 'original')
    : getImageUrl(series.backdrop || series.poster || null, 'original');
  const poster = isMovie
    ? getImageUrl(movie.poster_path)
    : getImageUrl(series.poster || series.backdrop || null);
  const overview = item.overview || movie.overview || series.overview;
  const playHref = isMovie ? `/movies/${id}` : `/series/${id}`;
  const isInList = isFavorite(id);
  const matchPercent = Math.min(99, Math.round(numRating * 10));

  const episodes = series.episodes || [];
  const seasons = Array.from(new Set(episodes.map((e) => e.season))).sort((a, b) => a - b);
  const activeSeasonEpisodes = episodes.filter((e) => e.season === selectedSeason);

  return (
    <div className="media-modal-backdrop" onClick={onClose}>
      <div
        className="media-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '850px', background: '#181818', borderRadius: '12px', overflow: 'hidden' }}
      >
        <button onClick={onClose} className="media-modal-close-btn" aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Hero Banner */}
        <div
          className="media-modal-hero"
          style={{ backgroundImage: `url(${backdrop})`, height: '360px', position: 'relative' }}
        >
          <div className="media-modal-hero-gradient" />
          <div className="media-modal-hero-content" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.06em' }}>
                {isMovie ? 'NETFLIX FILM' : 'NETFLIX SERIES'}
              </span>
            </div>

            <h2 className="media-modal-title" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {title}
            </h2>

            <div className="media-modal-actions" style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <Link
                href={playHref}
                className="btn-netflix-play"
                style={{ padding: '10px 24px', fontSize: '0.95rem' }}
              >
                <Play size={20} fill="#000" color="#000" /> Play Now
              </Link>
              <button
                type="button"
                onClick={(e) =>
                  toggleFavorite({
                    id,
                    type: isMovie ? 'movie' : 'series',
                    title,
                    poster,
                    backdrop,
                    rating: numRating,
                    year: yearText,
                  }, e)
                }
                className={`media-modal-list-btn ${isInList ? 'in-list' : ''}`}
                title={isInList ? 'Remove from My List' : 'Add to My List'}
              >
                {isInList ? <Check size={18} color="var(--accent)" /> : <Plus size={18} />}
                <span>{isInList ? 'In My List' : 'My List'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="media-modal-body" style={{ padding: '24px 32px' }}>
          <div className="media-modal-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span className="netflix-match-score" style={{ fontSize: '1rem', fontWeight: 800 }}>
              {matchPercent}% Match
            </span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{yearText}</span>
            <span className="netflix-quality-badge">16+</span>
            <span className="netflix-quality-badge">{isMovie ? '1080p FHD' : 'HD TV'}</span>
            <span className="netflix-quality-badge">DOLBY 5.1</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffb400', fontSize: '0.88rem', marginLeft: 'auto' }}>
              <Star size={15} fill="#ffb400" /> {ratingText} / 10
            </div>
          </div>

          <p className="media-modal-overview" style={{ fontSize: '0.96rem', lineHeight: 1.6, color: '#d2d2d2', marginBottom: '24px' }}>
            {overview || 'No synopsis available for this title.'}
          </p>

          {/* If Series: Episode List Preview */}
          {!isMovie && episodes.length > 0 && (
            <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Episodes
                </h3>
                {seasons.length > 1 && (
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {seasons.map((s) => (
                      <option key={s} value={s} style={{ background: '#202020', color: '#fff' }}>
                        Season {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {activeSeasonEpisodes.slice(0, 8).map((ep) => (
                  <Link
                    key={ep.id || `${ep.season}-${ep.episode}`}
                    href={`/series/${id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>
                      {ep.episode}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                        {ep.title || `Episode ${ep.episode}`}
                      </div>
                      {ep.overview && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ep.overview}
                        </div>
                      )}
                    </div>
                    <Play size={16} color="var(--accent)" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div
            className="media-modal-footer"
            style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Dual Ultra HD Servers • VidSrc & VidLink
            </span>
            <Link
              href={playHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#fff',
                fontSize: '0.88rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>Watch Full {isMovie ? 'Movie' : 'Show'}</span> →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaModal;
