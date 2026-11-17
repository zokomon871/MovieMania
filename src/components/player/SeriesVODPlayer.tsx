'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, SkipForward, SkipBack, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { VODServer } from '@/lib/mediaUtils';
import { enterFullscreenLandscape, exitFullscreenPortrait, isCurrentlyFullscreen } from '@/lib/fullscreenHelper';
import { useAutoStreamServer } from '@/hooks/useAutoStreamServer';

interface Props {
  seriesId: string;
  tmdbId?: string | number;
  title: string;
  season: number;
  episode: number;
  hasPrevEpisode?: boolean;
  onPrevEpisode?: () => void;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
}

const SERVER_CONFIG: Array<{ key: VODServer; name: string; badge: string; num: string }> = [
  { key: 'vidsrc', name: 'VidSrc', badge: 'HD', num: '#1' },
  { key: 'vidlink', name: 'VidLink', badge: '1080p', num: '#2' },
  { key: 'cinesrc', name: 'CineSrc', badge: 'HD', num: '#3' },
  { key: 'modiplay', name: 'AutoEmbed', badge: 'HD', num: '#4' },
];

export function SeriesVODPlayer({
  seriesId,
  tmdbId,
  title,
  season,
  episode,
  hasPrevEpisode = false,
  onPrevEpisode,
  hasNextEpisode = false,
  onNextEpisode,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    selectedMode,
    activeServer,
    activeUrl,
    isSwitching,
    switchMessage,
    isVerifiedPlaying,
    handleSelectMode,
    handleNextServer,
    markServerLoaded,
    markServerError,
  } = useAutoStreamServer({
    type: 'series',
    id: seriesId,
    tmdbId,
    season,
    episode,
  });

  const toggleFullscreen = async () => {
    if (!isCurrentlyFullscreen()) {
      await enterFullscreenLandscape(containerRef.current);
    } else {
      await exitFullscreenPortrait();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = isCurrentlyFullscreen();
      setIsFullscreen(fs);
      if (!fs) {
        try {
          window.screen?.orientation?.unlock?.();
        } catch {}
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div style={{ width: '100%' }}>
      {/* ─── 1. Cinema Video Player Stage (16:9, max-height 65vh) ─── */}
      <div
        className={`player-stage ${isFullscreen ? 'fullscreen' : ''}`}
        ref={containerRef}
      >
        {/* Top Header Bar Inside Player */}
        <div className="vod-player-header">
          <div className="vod-player-header-left">
            <div className="vod-now-playing-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isVerifiedPlaying ? '#22c55e' : '#eab308',
                  boxShadow: isVerifiedPlaying ? '0 0 8px #22c55e' : 'none',
                }}
              />
              STREAMING • {selectedMode === 'auto' ? `AUTO (${activeServer.toUpperCase()})` : activeServer.toUpperCase()}
            </div>
            <div className="vod-player-title" title={title}>{title}</div>
            <span className="vod-season-pill">
              S{season}:E{episode}
            </span>
          </div>

          <div className="vod-player-header-right">
            <button
              onClick={toggleFullscreen}
              className="vod-fullscreen-btn"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        {/* Auto-Switch / Failover Toast */}
        {switchMessage && (
          <div
            style={{
              position: 'absolute',
              top: '65px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 15, 17, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '24px',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <Zap size={14} color="#ffd200" />
            <span>{switchMessage}</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isSwitching && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#000',
              zIndex: 35,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Connecting to episode stream mirror...
            </span>
          </div>
        )}

        {/* Embedded Iframe */}
        <iframe
          key={activeUrl}
          src={activeUrl}
          title={title}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={markServerLoaded}
          onError={markServerError}
        />
      </div>

      {/* ─── 2. All-in-One MultiMovies Responsive Server Switcher Box ─── */}
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
            title="Having issues? Click to try next server"
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

      {/* ─── 3. Quick Prev / Next Episode Navigator Bar ─── */}
      <div className="ep-navigator-bar">
        <button
          type="button"
          onClick={onPrevEpisode}
          disabled={!hasPrevEpisode || !onPrevEpisode}
          className="ep-nav-btn"
          title="Previous Episode"
        >
          <SkipBack size={15} />
          <span>Previous Episode</span>
        </button>

        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Season {season} • Episode {episode}
        </span>

        <button
          type="button"
          onClick={onNextEpisode}
          disabled={!hasNextEpisode || !onNextEpisode}
          className="ep-nav-btn"
          title="Next Episode"
        >
          <span>Next Episode</span>
          <SkipForward size={15} />
        </button>
      </div>
    </div>
  );
}

export default SeriesVODPlayer;
