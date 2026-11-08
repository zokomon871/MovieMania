'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { IEpisode } from '@/lib/types';

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
    <div style={{ marginTop: '32px' }}>
      {/* ── Season Tabs ── */}
      <div className="season-tabs-scroll">
        {seasons.map((s) => {
          const isActive = s === currentSeason;
          return (
            <button
              key={s}
              onClick={() => onSelectSeason(s)}
              className={`season-tab-btn ${isActive ? 'active' : ''}`}
            >
              Season {s}
            </button>
          );
        })}
      </div>

      {/* ── Episode Cards Grid ── */}
      <div className="episode-cards-grid">
        {activeEpisodes.map((ep) => {
          const isCurrent = ep.season === currentSeason && ep.episode === currentEpisode;
          return (
            <div
              key={ep.id || `${ep.season}:${ep.episode}`}
              onClick={() => onSelectEpisode(ep.season, ep.episode)}
              className={`episode-card ${isCurrent ? 'active' : ''}`}
            >
              <div className="episode-badge">
                {isCurrent ? <Play size={15} fill="currentColor" /> : ep.episode}
              </div>

              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div className="episode-title">
                  {ep.title || `Episode ${ep.episode}`}
                </div>
                <div className="episode-sub">
                  {isCurrent ? 'Now Playing' : `S${ep.season} • E${ep.episode}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default EpisodeSelector;
