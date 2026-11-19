'use client';

import React from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { VODServer } from '@/lib/mediaUtils';
import { useAutoStreamServer } from '@/hooks/useAutoStreamServer';

interface VODPlayerProps {
  tmdbId?: string | number;
  imdbId?: string | number;
  title: string;
}

const SERVER_CONFIG: Array<{ key: VODServer; name: string; badge: string; num: string }> = [
  { key: 'modiplay', name: 'CineVerse', badge: '1080p', num: '#1' },
  { key: 'iqsmart', name: 'AutoEmbed 2', badge: '1080p', num: '#2' },
  { key: 'vidsrc', name: 'VidSrc', badge: 'HD', num: '#3' },
  { key: 'vidlink', name: 'VidLink', badge: '1080p', num: '#4' },
  { key: 'cinesrc', name: 'CineSrc', badge: 'HD', num: '#5' },
];

export function VODPlayer({ tmdbId, imdbId, title }: VODPlayerProps) {
  const {
    selectedMode,
    activeServer,
    activeUrl,
    isSwitching,
    handleSelectMode,
    handleNextServer,
    markServerLoaded,
    markServerError,
  } = useAutoStreamServer({
    type: 'movie',
    id: imdbId || tmdbId || '',
    tmdbId,
  });

  return (
    <div style={{ width: '100%' }}>
      {/* ─── Clean Cinema Video Stage (Native Iframe Provider Player) ─── */}
      <div className="player-stage">
        {/* Loading Indicator during mirror switch */}
        {isSwitching && (
          <div className="vod-loading-overlay">
            <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Connecting to stream mirror...
            </span>
          </div>
        )}

        {/* The streaming source iframe */}
        <iframe
          key={activeUrl}
          src={activeUrl}
          title={title}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          sandbox="allow-forms allow-scripts allow-same-origin allow-presentation allow-downloads"
          onLoad={markServerLoaded}
          onError={markServerError}
        />
      </div>

      {/* ─── Server Switcher Box ─── */}
      <div className="server-switcher-box">
        <div className="server-strip-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Choose server</span>
            <span style={{ fontSize: '0.72rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> Auto-healing active
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextServer}
            className="report-issue"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Having issues? Click to switch to next server mirror"
          >
            <RefreshCw size={12} />
            <span>Try Next Server</span>
          </button>
        </div>

        <div className="server-grid" id="playerServerGrid">
          {/* Auto Smart Best Server Chip */}
          <button
            type="button"
            onClick={() => handleSelectMode('auto')}
            className={`server-chip ${selectedMode === 'auto' ? 'active' : ''}`}
            aria-pressed={selectedMode === 'auto'}
            title="Smart auto detection & failover"
          >
            <span className="server-dot" />
            <span className="server-num">⚡</span>
            <span className="server-name">Auto (Best)</span>
            <span className="server-badge">SMART</span>
          </button>

          {/* Configured Mirrors */}
          {SERVER_CONFIG.map((srv) => {
            const isCurrent =
              selectedMode === srv.key || (selectedMode === 'auto' && activeServer === srv.key);
            return (
              <button
                key={srv.key}
                type="button"
                onClick={() => handleSelectMode(srv.key)}
                className={`server-chip ${isCurrent ? 'active' : ''}`}
                aria-pressed={isCurrent}
                title={`Switch directly to ${srv.name}`}
              >
                <span className="server-dot" />
                <span className="server-num">{srv.num}</span>
                <span className="server-name">{srv.name}</span>
                <span className="server-badge">{srv.badge}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VODPlayer;
