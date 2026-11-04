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
  // Group episodes by season
  const seasons = Array.from(new Set(episodes.map((e) => e.season))).sort((a, b) => a - b);
  const activeEpisodes = episodes.filter((e) => e.season === currentSeason).sort((a, b) => a.episode - b.episode);

  return (
    <div style={{ marginTop: '36px' }}>
      {/* ── Season Tabs ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '16px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        {seasons.map((s) => {
          const isActive = s === currentSeason;
          return (
            <button
              key={s}
              onClick={() => onSelectSeason(s)}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                border: '1px solid',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                background: isActive ? 'var(--accent)' : 'var(--bg-surface)',
                color: isActive ? 'var(--text-inverse)' : 'var(--text)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--duration-fast) var(--ease)',
              }}
            >
              Season {s}
            </button>
          );
        })}
      </div>

      {/* ── Episode Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {activeEpisodes.map((ep) => {
          const isCurrent = ep.season === currentSeason && ep.episode === currentEpisode;
          return (
            <div
              key={ep.id || `${ep.season}:${ep.episode}`}
              onClick={() => onSelectEpisode(ep.season, ep.episode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 14px',
                background: isCurrent ? 'var(--accent-muted)' : 'var(--bg-surface)',
                border: '1px solid',
                borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: isCurrent ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: isCurrent ? 'var(--text-inverse)' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {isCurrent ? <Play size={16} fill="currentColor" /> : ep.episode}
              </div>

              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ep.title || `Episode ${ep.episode}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: isCurrent ? 'var(--accent)' : 'var(--text-muted)', marginTop: '2px' }}>
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

