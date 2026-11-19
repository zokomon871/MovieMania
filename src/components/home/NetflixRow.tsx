'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Star, X } from 'lucide-react';
import { ITMDBMovie, ISeries, IChannel } from '@/lib/types';
import { getImageUrl, formatRating, formatYear, FALLBACK_POSTER } from '@/lib/mediaUtils';
import { useFavorites } from '@/hooks/useFavorites';
import { IWatchHistoryItem } from '@/hooks/useWatchHistory';

export interface RowMediaItem {
  id: string;
  type: 'movie' | 'series' | 'channel' | 'history';
  title: string;
  poster?: string | null;
  backdrop?: string | null;
  rating?: number;
  year?: string;
  categories?: string[];
  progressPercent?: number;
  season?: number;
  episode?: number;
  channelData?: IChannel;
}

interface Props {
  title: string;
  icon?: React.ReactNode;
  items: RowMediaItem[];
  isTop10?: boolean;
  isContinueWatching?: boolean;
  viewAllHref?: string;
  onSelectMedia?: (item: RowMediaItem) => void;
  onPlayChannel?: (channel: IChannel) => void;
  onRemoveHistory?: (id: string, e: React.MouseEvent) => void;
}

export function NetflixRow({
  title,
  icon,
  items,
  isTop10 = false,
  isContinueWatching = false,
  viewAllHref,
  onSelectMedia,
  onPlayChannel,
  onRemoveHistory,
}: Props) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const offset = sliderRef.current.clientWidth * 0.75;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    });
  };

  return (
    <section className="netflix-shelf">
      <div className="netflix-shelf-header">
        <h2 className="netflix-shelf-title">
          {icon}
          <span>{title}</span>
        </h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="netflix-shelf-explore">
            <span>Explore All</span>
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      <div className="netflix-slider-wrap">
        <button
          type="button"
          onClick={() => scroll('left')}
          className="netflix-shelf-arrow left"
          aria-label="Scroll row left"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="netflix-slider-track" ref={sliderRef}>
          {items.map((item, index) => {
            const inList = isFavorite(item.id);
            const posterSrc = getImageUrl(item.poster || item.backdrop || null);
            const rank = index + 1;

            const handleCardClick = (e: React.MouseEvent) => {
              if (item.type === 'channel' && item.channelData && onPlayChannel) {
                e.preventDefault();
                onPlayChannel(item.channelData);
                return;
              }
              // Direct navigation to single detail page without modal popup
            };

            const targetHref =
              item.type === 'movie'
                ? `/movies/${item.id}`
                : item.type === 'series'
                ? `/series/${item.id}`
                : item.type === 'channel'
                ? `/#live-directory`
                : `/movies/${item.id}`;

            if (isTop10) {
              return (
                <div key={item.id} className="netflix-top10-item">
                  <span className="netflix-top10-rank">{rank}</span>
                  <Link
                    href={targetHref}
                    prefetch={true}
                    onClick={handleCardClick}
                    className="netflix-top10-card netflix-card"
                  >
                    <div className="netflix-card-poster">
                      <img
                        src={posterSrc}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          if (e.currentTarget.src !== FALLBACK_POSTER) {
                            e.currentTarget.src = FALLBACK_POSTER;
                          }
                        }}
                      />
                      <div className="netflix-card-badge">TOP 10</div>
                      <div className="movie-card-overlay">
                        <div className="movie-play-btn">
                          <Play size={20} fill="#fff" />
                        </div>
                      </div>
                    </div>
                    <div className="netflix-card-info">
                      <h4 className="netflix-card-title">{item.title}</h4>
                      <div className="netflix-card-meta">
                        <span>{item.year || '2024'}</span>
                        {item.rating ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#46d369', fontWeight: 700 }}>
                            <Star size={12} fill="#46d369" /> {formatRating(item.rating)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            }

            return (
              <div key={item.id} className="netflix-card" style={{ flexShrink: 0 }}>
                <Link
                  href={targetHref}
                  prefetch={true}
                  onClick={handleCardClick}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="netflix-card-poster">
                    <img
                      src={posterSrc}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_POSTER) {
                          e.currentTarget.src = FALLBACK_POSTER;
                        }
                      }}
                    />

                    {item.type === 'channel' ? (
                      <div className="netflix-card-badge live">LIVE</div>
                    ) : item.type === 'series' ? (
                      <div className="netflix-card-badge">SERIES</div>
                    ) : (
                      <div className="netflix-card-badge">HD</div>
                    )}

                    {isContinueWatching && item.progressPercent !== undefined && (
                      <div className="netflix-progress-bar">
                        <div
                          className="netflix-progress-fill"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    )}

                    <div className="movie-card-overlay">
                      <div className="movie-play-btn">
                        <Play size={20} fill="#fff" />
                      </div>
                    </div>
                  </div>

                  <div className="netflix-card-info">
                    <h4 className="netflix-card-title">{item.title}</h4>
                    <div className="netflix-card-meta">
                      <span>{item.year || (item.season ? `S${item.season} E${item.episode}` : '')}</span>
                      {item.rating ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#46d369', fontWeight: 700 }}>
                          <Star size={11} fill="#46d369" /> {formatRating(item.rating)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>

                {/* Quick Add To My List Button on Card */}
                <button
                  type="button"
                  onClick={(e) =>
                    toggleFavorite({
                      id: item.id,
                      type: item.type === 'history' ? 'movie' : item.type,
                      title: item.title,
                      poster: item.poster,
                      backdrop: item.backdrop,
                      rating: item.rating,
                      year: item.year,
                    }, e)
                  }
                  className={`card-favorite-btn ${inList ? 'active' : ''}`}
                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 6, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '6px' }}
                  title={inList ? 'In My List' : 'Add to My List'}
                >
                  {inList ? <Check size={14} color="var(--accent)" /> : <Plus size={14} color="#fff" />}
                </button>

                {isContinueWatching && onRemoveHistory && (
                  <button
                    type="button"
                    onClick={(e) => onRemoveHistory(item.id, e)}
                    style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 6, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    title="Remove from history"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          className="netflix-shelf-arrow right"
          aria-label="Scroll row right"
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </section>
  );
}

export default NetflixRow;
