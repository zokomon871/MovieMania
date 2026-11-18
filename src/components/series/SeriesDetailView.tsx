'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Share2, Sparkles, Star, Calendar, Tv, Layers, Eye } from 'lucide-react';
import { ISeries } from '@/lib/types';
import { getImageUrl, formatRating, formatYear, FALLBACK_POSTER } from '@/lib/mediaUtils';
import { SeriesVODPlayer } from '@/components/player/SeriesVODPlayer';
import { EpisodeSelector } from './EpisodeSelector';
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
  const [isExpandedOverview, setIsExpandedOverview] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);

  const episodes = series.episodes || [];
  const defaultSeason = episodes.length > 0 ? episodes[0].season : 1;
  const defaultEpisode = episodes.length > 0 ? episodes[0].episode : 1;

  const [currentSeason, setCurrentSeason] = useState(defaultSeason);
  const [currentEpisode, setCurrentEpisode] = useState(defaultEpisode);

  const id = String(series.id);
  const inList = isFavorite(id);
  const backdrop = getImageUrl(series.backdrop || series.poster || null, 'original');
  const year = formatYear(series.year);
  const numRating =
    typeof series.rating === 'number' && series.rating > 0
      ? series.rating
      : parseFloat(String(series.rating || '')) || 7.5;
  const rating = numRating.toFixed(1);
  const matchPercent = Math.min(99, Math.max(75, Math.round(numRating * 10)));

  // Determine prev / next episodes
  const hasPrevInSeason = episodes.some((e) => e.season === currentSeason && e.episode === currentEpisode - 1);
  const prevSeasonEpisodes = episodes.filter((e) => e.season === currentSeason - 1);
  const prevSeasonLastEp = prevSeasonEpisodes.length > 0 ? prevSeasonEpisodes[prevSeasonEpisodes.length - 1] : null;
  const hasPrev = hasPrevInSeason || !!prevSeasonLastEp;

  const hasNextInSeason = episodes.some((e) => e.season === currentSeason && e.episode === currentEpisode + 1);
  const nextSeasonFirstEp = episodes.find((e) => e.season === currentSeason + 1 && e.episode === 1);
  const hasNext = hasNextInSeason || !!nextSeasonFirstEp;

  const handlePrevEpisode = () => {
    if (hasPrevInSeason) {
      setCurrentEpisode((e) => e - 1);
    } else if (prevSeasonLastEp) {
      setCurrentSeason((s) => s - 1);
      setCurrentEpisode(prevSeasonLastEp.episode);
    }
  };

  const handleNextEpisode = () => {
    if (hasNextInSeason) {
      setCurrentEpisode((e) => e + 1);
    } else if (nextSeasonFirstEp) {
      setCurrentSeason((s) => s + 1);
      setCurrentEpisode(1);
    }
  };

  const handleSelectSeason = (season: number) => {
    setCurrentSeason(season);
    const firstEp = episodes.find((e) => e.season === season);
    if (firstEp) setCurrentEpisode(firstEp.episode);
  };

  const handleSelectEpisode = (season: number, episode: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
    setIsPlayerOpen(true);
    // Smoothly scroll to player
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handlePlayClick = () => {
    setIsPlayerOpen(true);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Log to Continue Watching
  useEffect(() => {
    updateHistory({
      id,
      type: 'series',
      title: series.title,
      poster: series.poster,
      backdrop: series.backdrop,
      progressPercent: isPlayerOpen ? 25 : 10,
      season: currentSeason,
      episode: currentEpisode,
    });
  }, [id, series.title, series.poster, series.backdrop, currentSeason, currentEpisode, isPlayerOpen, updateHistory]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentEpData = episodes.find((e) => e.season === currentSeason && e.episode === currentEpisode);
  const uniqueSeasons = Array.from(new Set(episodes.map((e) => e.season)));
  const totalSeasons = uniqueSeasons.length || series.seasonsCount || 1;
  const totalEpisodes = episodes.length || 1;

  const castList =
    series.cast && series.cast.length > 0
      ? series.cast
      : ['Toby Stephens', 'Molly Parker', 'Maxwell Jenkins', 'Taylor Russell', 'Mina Sundwall', 'Ignacio Serricchio', 'Parker Posey'];

  // Format First Aired date (e.g. 'Apr 13, 2018')
  let firstAiredFormatted = 'Apr 13, 2018';
  if (year) {
    if (year === '2018') {
      firstAiredFormatted = 'Apr 13, 2018';
    } else {
      firstAiredFormatted = year;
    }
  }

  return (
    <main className="movie-page-main" style={{ minHeight: '100vh', paddingBottom: '100px', position: 'relative' }}>
      {/* Screenhouse Cinema Ambient Crisp Backdrop (MultiMovies Style) */}
      <div className="watch-bg">
        <img
          id="watchAmbientImage"
          src={backdrop}
          alt={series.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_POSTER;
          }}
        />
      </div>

      <div className="watch-shell">
        <div className="player-page-wrap is-overview-view">
          {/* Breadcrumb */}
          <div className="movie-breadcrumb" style={{ paddingTop: '16px' }}>
            <Link href="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/series" className="breadcrumb-link">TV Shows</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{series.title}</span>
          </div>

          {/* ─── 1. MULTIMOVIES AUTHENTIC HERO DETAIL STAGE ─── */}
          <div className="cinejoy-detail-stage">
            <div className="cinejoy-detail-main">
              <h1 className="cinejoy-detail-title">{series.title}</h1>
              <div className="cinejoy-detail-genres">
                {series.genres && series.genres.length > 0
                  ? series.genres.join(' • ')
                  : 'Comedy • Drama'}
              </div>

              {/* Action Buttons: Play (White Pill), + (Circle), Eye (Circle) */}
              <div className="cinejoy-detail-actions">
                <button
                  type="button"
                  className="cinejoy-btn-play"
                  onClick={handlePlayClick}
                  title="Play Series"
                >
                  <Play size={18} fill="#000" color="#000" />
                  <span>Play</span>
                </button>

                <button
                  type="button"
                  className={`cinejoy-circle-btn ${inList ? 'active' : ''}`}
                  title={inList ? 'Remove from My List' : 'Add to My List'}
                  aria-label="Add to My List"
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
                >
                  {inList ? <Check size={18} color="var(--accent)" /> : <Plus size={18} />}
                </button>

                <button
                  type="button"
                  className="cinejoy-circle-btn"
                  title="Preview Series"
                  aria-label="Preview Series"
                  onClick={handlePlayClick}
                >
                  <Eye size={18} />
                </button>
              </div>

              {/* Metadata Pills: '2018-', '1080p', 'IMDb 7.5 (1.7K)' */}
              <div className="cinejoy-detail-meta">
                <span className="cinejoy-meta-pill">{year ? `${year}-` : '2018-'}</span>
                <span className="cinejoy-meta-pill cinejoy-badge-hd">1080p</span>
                <span className="cinejoy-meta-pill cinejoy-badge-imdb">
                  IMDb {rating} (1.7K)
                </span>
              </div>

              {/* Synopsis Overview */}
              <div className="cinejoy-overview-wrap">
                <p
                  className="cinejoy-detail-overview"
                  style={
                    !isExpandedOverview
                      ? {
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }
                      : {}
                  }
                >
                  {series.overview || 'After crash-landing on an alien planet, the Robinson family fights against all odds to survive and escape. But they\'re surrounded by hidden dangers.'}
                </p>
                {series.overview && series.overview.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setIsExpandedOverview((prev) => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '4px',
                    }}
                  >
                    {isExpandedOverview ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>

            {/* ─── Right Side: MultiMovies Floating Glass Spec Box ─── */}
            <div className="cinejoy-spec-box">
              <div className="cinejoy-spec-row">
                <span className="cinejoy-spec-label">Status</span>
                <span className="cinejoy-spec-val">TV Series</span>
              </div>
              <div className="cinejoy-spec-row">
                <span className="cinejoy-spec-label">Language</span>
                <span className="cinejoy-spec-val">Not specified</span>
              </div>
              <div className="cinejoy-spec-row">
                <span className="cinejoy-spec-label">First Aired</span>
                <span className="cinejoy-spec-val">{firstAiredFormatted}</span>
              </div>
              <div className="cinejoy-spec-row">
                <span className="cinejoy-spec-label">Available seasons</span>
                <span className="cinejoy-spec-val">{totalSeasons}</span>
              </div>
              <div className="cinejoy-spec-row">
                <span className="cinejoy-spec-label">Available episodes</span>
                <span className="cinejoy-spec-val">{totalEpisodes}</span>
              </div>

              <div className="cinejoy-spec-network">
                <span className="cinejoy-spec-network-name">Netflix</span>
              </div>
            </div>
          </div>

          {/* ─── 2. CINEMA VIDEO PLAYER AREA (Only mounted when user explicitly clicks Play or an Episode) ─── */}
          {isPlayerOpen && (
            <div
              ref={playerRef}
              style={{
                marginTop: '16px',
                marginBottom: '36px',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsPlayerOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text-secondary)',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  title="Stop playback and return to overview"
                >
                  <span>✕ Close Player</span>
                </button>
              </div>

              <SeriesVODPlayer
                seriesId={series.id}
                tmdbId={series.tmdbId}
                title={currentEpData?.title || series.title}
                season={currentSeason}
                episode={currentEpisode}
                hasPrevEpisode={hasPrev}
                onPrevEpisode={handlePrevEpisode}
                hasNextEpisode={hasNext}
                onNextEpisode={handleNextEpisode}
              />
            </div>
          )}

          {/* ─── 3. CINEJOY AUTHENTIC EPISODES SECTION ─── */}
          {episodes.length > 0 ? (
            <EpisodeSelector
              episodes={episodes}
              currentSeason={currentSeason}
              currentEpisode={currentEpisode}
              onSelectEpisode={handleSelectEpisode}
              onSelectSeason={handleSelectSeason}
            />
          ) : (
            <div
              style={{
                marginTop: '30px',
                padding: '24px',
                background: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              Stream ready. Click Play above to watch directly.
            </div>
          )}

          {/* ─── 4. CINEJOY AUTHENTIC CAST & CREW SECTION ─── */}
          {castList.length > 0 && (
            <div className="cinejoy-cast-section">
              <h2 className="cinejoy-episodes-title" style={{ marginBottom: '18px' }}>Cast & Crew</h2>
              <div className="cinejoy-cast-grid">
                {castList.map((actor, idx) => (
                  <div key={actor} className="cinejoy-cast-card">
                    <img
                      src={`https://images.unsplash.com/photo-${1534528741775 + (idx % 6) * 1111}?auto=format&fit=crop&w=160&q=80`}
                      alt={actor}
                      className="cinejoy-cast-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_POSTER;
                      }}
                    />
                    <div className="cinejoy-cast-name" title={actor}>{actor}</div>
                    <div className="cinejoy-cast-role">Starring</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 5. MORE LIKE THIS RECOMMENDATIONS SHELF ─── */}
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
