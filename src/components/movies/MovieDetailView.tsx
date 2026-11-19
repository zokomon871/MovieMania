'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Calendar, Plus, Check, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { getImageUrl, formatRating, formatYear, FALLBACK_POSTER } from '@/lib/mediaUtils';
import { VODPlayer } from '@/components/player/VODPlayer';
import { MediaRow } from '@/components/common/MediaRow';
import { CastAvatar } from '@/components/common/CastAvatar';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';

interface MovieDetailViewProps {
  movie: ITMDBMovie;
  relatedMovies: ITMDBMovie[];
}

export function MovieDetailView({ movie, relatedMovies }: MovieDetailViewProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { updateHistory } = useWatchHistory();
  const [copied, setCopied] = useState(false);

  const id = movie.id.toString();
  const inList = isFavorite(id);
  const backdrop = getImageUrl(movie.backdrop_path || movie.poster_path, 'original');
  const poster = getImageUrl(movie.poster_path);
  const year = formatYear(movie.release_date);
  const rating = formatRating(movie.vote_average);
  const numericRating = typeof movie.vote_average === 'number' ? movie.vote_average : parseFloat(String(movie.vote_average || 7.5)) || 7.5;
  const matchPercent = Math.min(99, Math.round(numericRating * 10));

  // Log to Continue Watching
  useEffect(() => {
    updateHistory({
      id,
      type: 'movie',
      title: movie.title,
      poster: movie.poster_path,
      backdrop: movie.backdrop_path,
      progressPercent: 15,
    });
  }, [id, movie.title, movie.poster_path, movie.backdrop_path, updateHistory]);

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
            <img
              src={poster}
              alt={movie.title}
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
                onClick={(e) =>
                  toggleFavorite({
                    id,
                    type: 'movie',
                    title: movie.title,
                    poster: movie.poster_path,
                    backdrop: movie.backdrop_path,
                    rating: numericRating,
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
              <h2 className="movie-overview-heading">Storyline</h2>
              <p className="movie-overview-text">
                {movie.overview || 'No detailed synopsis available for this title.'}
              </p>
            </div>

            {movie.cast && movie.cast.length > 0 && (
              <div className="cinejoy-cast-section" style={{ marginTop: '24px' }}>
                <h3 className="cinejoy-cast-heading">Cast & Crew</h3>
                <div className="cinejoy-cast-row">
                  {movie.cast.map((actor) => (
                    <CastAvatar key={actor} name={actor} role="Starring" size={76} />
                  ))}
                  {movie.director && movie.director.length > 0 && movie.director.map((dir) => (
                    <CastAvatar key={`dir-${dir}`} name={dir} role="Director" size={76} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedMovies.length > 0 && (
          <div className="movie-related-section">
            <MediaRow
              title="More Blockbusters You May Like"
              icon={<Sparkles size={20} color="var(--accent)" />}
              items={relatedMovies}
              type="movie"
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default MovieDetailView;

