'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, SkipForward, RefreshCw, Zap } from 'lucide-react';
import { VODServer } from '@/lib/mediaUtils';
import { enterFullscreenLandscape, exitFullscreenPortrait, isCurrentlyFullscreen } from '@/lib/fullscreenHelper';
import { useAutoStreamServer } from '@/hooks/useAutoStreamServer';

interface Props {
  seriesId: string;
  tmdbId?: string | number;
  title: string;
  season: number;
  episode: number;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
}

export function SeriesVODPlayer({
  seriesId,
  tmdbId,
  title,
  season,
  episode,
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
    <div
      className={`cinema-player-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100%' : 'auto',
        aspectRatio: isFullscreen ? 'auto' : '16/9',
        background: '#000',
        borderRadius: isFullscreen ? '0' : '16px',
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid var(--border-hover)',
      }}
    >
      {/* Series Player Header Bar */}
      <div className="vod-player-header">
        <div className="vod-player-header-left">
          <div className="vod-now-playing-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
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
          {/* Server Switcher with Auto Best Mode */}
          <div className="vod-server-switcher">
            <button
              type="button"
              onClick={() => handleSelectMode('auto')}
              className={`vod-server-pill-btn ${selectedMode === 'auto' ? 'active' : ''}`}
              title="Automatically select and switch to the best playing server"
            >
              <Zap size={12} fill={selectedMode === 'auto' ? 'currentColor' : 'none'} />
              <span>Auto</span>
            </button>

            {(['vidsrc', 'vidlink', 'cinesrc'] as VODServer[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSelectMode(s)}
                className={`vod-server-pill-btn ${selectedMode === s || (selectedMode === 'auto' && activeServer === s) ? 'active' : ''}`}
                title={`Switch directly to ${s.toUpperCase()}`}
              >
                {s === 'vidsrc' ? 'VidSrc' : s === 'vidlink' ? 'VidLink' : 'CineSrc'}
              </button>
            ))}

            {/* Quick Next Server Skip Button */}
            <button
              type="button"
              onClick={handleNextServer}
              className="vod-server-pill-btn"
              title="Having issues? Try Next Server"
              style={{ opacity: 0.85 }}
            >
              <RefreshCw size={12} />
              <span style={{ fontSize: '0.72rem' }}>Next</span>
            </button>
          </div>

          {hasNextEpisode && onNextEpisode && (
            <button onClick={onNextEpisode} className="vod-next-btn" title="Next Episode">
              <SkipForward size={13} /> <span>Next</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="vod-fullscreen-btn"
            title={isFullscreen ? 'Exit' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Auto Switch / Failover Notification Toast */}
      {switchMessage && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 15, 17, 0.92)',
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
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Zap size={14} color="#ffd200" />
          <span>{switchMessage}</span>
        </div>
      )}

      {/* Loading / Switching Overlay */}
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

      {/* Embedded Video Stream Player */}
      <iframe
        key={activeUrl}
        src={activeUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        onLoad={markServerLoaded}
        onError={markServerError}
      />
    </div>
  );
}

export default SeriesVODPlayer;
