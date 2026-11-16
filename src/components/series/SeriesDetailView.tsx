'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Calendar, Plus, Check, Share2, ShieldCheck, Layers, Sparkles } from 'lucide-react';
import { ISeries } from '@/lib/types';
import { getImageUrl, formatRating, formatYear, FALLBACK_POSTER } from '@/lib/mediaUtils';
import { SeriesPlayerView } from './SeriesPlayerView';
import { MediaRow } from '@/components/common/MediaRow';
import { MediaModal } from '@/components/common/MediaModal';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';

interface SeriesDetailViewProps {
  series: ISeries;
  relatedSeries: ISeries[];
}

export function SeriesDetailView({ series, relatedSeries }: SeriesDetailViewProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { updateHistory } = useWatchHistory();
  const [selectedRelated, setSelectedRelated] = useState<ISeries | null>(null);
  const [copied, setCopied] = useState(false);

  const id = String(series.id);
  const inList = isFavorite(id);
  const backdrop = getImageUrl(series.backdrop || series.poster || null, 'original');
  const poster = getImageUrl(series.poster || series.backdrop || null);
  const year = formatYear(series.year);
  const rating = formatRating(series.rating);
  const numRating = typeof series.rating === 'number' ? series.rating : parseFloat(String(series.rating || 7.5)) || 7.5;
  const matchPercent = Math.min(99, Math.round(numRating * 10));

  // Log to Continue Watching
  useEffect(() => {
    updateHistory({
      id,
      type: 'series',
      title: series.title,
      poster: series.poster,
      backdrop: series.backdrop,
      progressPercent: 20,
      season: 1,
      episode: 1,
    });
  }, [id, series.title, series.poster, series.backdrop, updateHistory]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="movie-page-main" style={{ minHeight: '100vh', paddingBottom: '100px', position: 'relative' }}>
      <div className="vod-backdrop-cover" style={{ backgroundImage: `url(${backdrop})` }} />

      <div className="container movie-page-container">
        {/* Breadcrumb */}
        <div className="movie-breadcrumb">
          <Link href="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/series" className="breadcrumb-link">TV Shows</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{series.title}</span>
        </div>

        {/* Player Section */}
        <div className="movie-player-section" style={{ marginBottom: '28px' }}>
          <SeriesPlayerView series={series} />
        </div>

        {/* Details Card */}
        <div className="movie-details-card">
          <div className="movie-poster-column">
            <img
              src={poster}
              alt={series.title}
              className="movie-detail-poster"
              onError={(e) => {
                if (e.currentTarget.src !== FALLBACK_POSTER) {
                  e.currentTarget.src = FALLBACK_POSTER;
                }
              }}
            />
          </div>

          <div className="movie-info-column">
            <div className="movie-badge-row">
              <span className="media-modal-match">{matchPercent}% Match</span>
              <span className="media-modal-badge">HD TV</span>
              <span className="media-modal-badge">Dolby 5.1</span>
              {series.seasonsCount && series.seasonsCount > 1 && (
                <span className="media-modal-badge">{series.seasonsCount} Seasons</span>
              )}
            </div>

            <h1 className="movie-detail-title">{series.title}</h1>

            <div className="movie-meta-strip">
              <div className="movie-meta-item movie-rating-item">
                <Star size={16} fill="var(--accent)" /> {rating} / 10
              </div>
              <div className="movie-meta-item">
                <Calendar size={15} /> {year}
              </div>
              <div className="movie-meta-item">
                <ShieldCheck size={15} /> Verified Stream
              </div>
            </div>

            <div className="movie-actions-strip">
              <button
                type="button"
                onClick={(e) =>
                  toggleFavorite({
                    id,
                    type: 'series',
                    title: series.title,
                    poster: series.poster,
                    backdrop: series.backdrop,
                    rating: numRating,
                    year,
                  }, e)
                }
                className={`movie-action-btn ${inList ? 'in-list' : ''}`}
              >
                {inList ? <Check size={18} /> : <Plus size={18} />}
                <span>{inList ? 'In My List' : 'Add to My List'}</span>
              </button>

              <button type="button" onClick={handleShare} className="movie-action-btn">
                <Share2 size={18} />
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>

            <div className="movie-overview-section">
              <h2 className="movie-overview-heading">Synopsis</h2>
              <p className="movie-overview-text">
                {series.overview || 'No synopsis available for this TV series.'}
              </p>
            </div>

            {series.genres && series.genres.length > 0 && (
              <div className="movie-genres-row">
                <span className="movie-genres-label">Genres:</span>
                <div className="movie-genres-list">
                  {series.genres.map((g) => (
                    <span key={g} className="movie-genre-chip">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Series Shelf */}
        {relatedSeries.length > 0 && (
          <div style={{ marginTop: '56px' }}>
            <MediaRow
              title="More TV Shows Like This"
              items={relatedSeries}
              type="series"
              viewAllHref="/series"
              onSelectMedia={(item) => setSelectedRelated(item as ISeries)}
            />
          </div>
        )}
      </div>

      <MediaModal
        item={selectedRelated}
        type="series"
        isOpen={!!selectedRelated}
        onClose={() => setSelectedRelated(null)}
      />
    </main>
  );
}

export default SeriesDetailView;
