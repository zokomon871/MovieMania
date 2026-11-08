'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Calendar, Plus, Check, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { getImageUrl } from '@/lib/mediaUtils';
import { VODPlayer } from '@/components/player/VODPlayer';
import { MediaRow } from '@/components/common/MediaRow';
import { MediaModal } from '@/components/common/MediaModal';
import { useFavorites } from '@/hooks/useFavorites';

interface MovieDetailViewProps {
  movie: ITMDBMovie;
  relatedMovies: ITMDBMovie[];
}

export function MovieDetailView({ movie, relatedMovies }: MovieDetailViewProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedRelated, setSelectedRelated] = useState<ITMDBMovie | null>(null);
  const [copied, setCopied] = useState(false);

  const id = movie.id.toString();
  const inList = isFavorite(id);
  const backdrop = getImageUrl(movie.backdrop_path || movie.poster_path, 'original');
  const poster = getImageUrl(movie.poster_path);
  const year = movie.release_date?.substring(0, 4) || 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
  const matchPercent = Math.min(99, Math.round((movie.vote_average || 7.5) * 10));

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="movie-page-main">
      <div className="vod-backdrop-cover" style={{ backgroundImage: `url(${backdrop})` }} />

      <div className="container movie-page-container">
        <div className="movie-breadcrumb">
          <Link href="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/movies" className="breadcrumb-link">Movies</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{movie.title}</span>
        </div>

        <div className="movie-player-section">
          <VODPlayer imdbId={movie.id} tmdbId={movie.tmdbId} title={movie.title} />
        </div>

        <div className="movie-details-card">
          <div className="movie-poster-column">
            <img src={poster} alt={movie.title} className="movie-detail-poster" />
          </div>

          <div className="movie-info-column">
            <div className="movie-badge-row">
              <span className="media-modal-match">{matchPercent}% Match</span>
              <span className="media-modal-badge">1080p FHD</span>
              <span className="media-modal-badge">Dolby 5.1</span>
            </div>

            <h1 className="movie-detail-title">{movie.title}</h1>

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
                onClick={(e) => toggleFavorite(id, e)}
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
              <h2 className="movie-overview-heading">Storyline</h2>
              <p className="movie-overview-text">
                {movie.overview || 'No detailed synopsis available for this title.'}
              </p>
            </div>
          </div>
        </div>

        {relatedMovies.length > 0 && (
          <div className="movie-related-section">
            <MediaRow
              title="More Blockbusters You May Like"
              icon={<Sparkles size={20} color="var(--accent)" />}
              items={relatedMovies}
              type="movie"
              onSelectMedia={(item) => setSelectedRelated(item as ITMDBMovie)}
            />
          </div>
        )}
      </div>

      <MediaModal
        item={selectedRelated}
        type="movie"
        isOpen={Boolean(selectedRelated)}
        onClose={() => setSelectedRelated(null)}
      />
    </main>
  );
}

export default MovieDetailView;

