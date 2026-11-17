'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { IEpisode } from '@/lib/types';
import { getImageUrl, FALLBACK_POSTER } from '@/lib/mediaUtils';

interface Props {
  episodes: IEpisode[];
  currentSeason: number;
  currentEpisode: number;
  onSelectEpisode: (season: number, episode: number) => void;
  onSelectSeason: (season: number) => void;
}

export function EpisodeSelector({
  episodes,
  currentSeason,
  currentEpisode,
  onSelectEpisode,
  onSelectSeason,
}: Props) {
  const seasons = Array.from(new Set(episodes.map((e) => e.season))).sort((a, b) => a - b);
  const activeEpisodes = episodes.filter((e) => e.season === currentSeason).sort((a, b) => a.episode - b.episode);

  return (
    <div className="cinejoy-episodes-section" id="episodes">
      {/* ─── Header: Title & Season Select Dropdown ─── */}
      <div className="cinejoy-episodes-header">
        <div>
          <h2 className="cinejoy-episodes-title">Episodes</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {activeEpisodes.length} episodes in Season {currentSeason}
          </p>
        </div>

        {seasons.length > 0 && (
          <div className="cinejoy-season-pill-dropdown">
            <select
              className="cinejoy-season-select"
              aria-label="Select Season"
              value={currentSeason}
              onChange={(e) => onSelectSeason(parseInt(e.target.value, 10))}
            >
              {seasons.map((s) => {
                const count = episodes.filter((e) => e.season === s).length;
                return (
                  <option key={s} value={s}>
                    Season {s} • {count} {count === 1 ? 'episode' : 'episodes'}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* ─── Responsive Episode Grid ─── */}
      <div className="cinejoy-season-grid">
        {activeEpisodes.map((ep) => {
          const isCurrent = ep.season === currentSeason && ep.episode === currentEpisode;
          const thumbnail = getImageUrl(ep.thumbnail || null);

          return (
            <div
              key={ep.id || `${ep.season}:${ep.episode}`}
              onClick={() => onSelectEpisode(ep.season, ep.episode)}
              className={`cinejoy-ep-card ${isCurrent ? 'is-playing' : ''}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectEpisode(ep.season, ep.episode);
                }
              }}
            >
              {/* 16:9 Thumbnail Box */}
              <div className="cinejoy-ep-thumb-box">
                <img
                  src={thumbnail}
                  alt={ep.title || `Episode ${ep.episode}`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_POSTER;
                  }}
                />

                {/* Top-Left Episode Pill (E1, E2, E3...) */}
                <span className="cinejoy-ep-badge-num">
                  {isCurrent ? 'PLAYING' : `E${ep.episode}`}
                </span>

                {/* Bottom-Right HD / Time Tag */}
                <span className="cinejoy-ep-badge-time">HD</span>

                {/* Hover Play Overlay */}
                <div className="cinejoy-ep-play-overlay">
                  <div className="cinejoy-ep-play-circle">
                    <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
                  </div>
                </div>
              </div>

              {/* Episode Info Body */}
              <div className="cinejoy-ep-body">
                <div className="cinejoy-ep-name" title={ep.title || `Episode ${ep.episode}`}>
                  {ep.episode}. {ep.title || `Episode ${ep.episode}`}
                </div>
                {ep.overview ? (
                  <p className="cinejoy-ep-desc">{ep.overview}</p>
                ) : (
                  <p className="cinejoy-ep-desc" style={{ fontStyle: 'italic', opacity: 0.6 }}>
                    No episode synopsis available.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EpisodeSelector;
