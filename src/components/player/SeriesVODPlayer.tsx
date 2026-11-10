'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, SkipForward } from 'lucide-react';
import { VODServer, getSeriesStreamUrls } from '@/lib/mediaUtils';
import { enterFullscreenLandscape, exitFullscreenPortrait, isCurrentlyFullscreen } from '@/lib/fullscreenHelper';

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
  const [server, setServer] = useState<VODServer>('vidsrc');

  const streamUrls = getSeriesStreamUrls(seriesId, season, episode, tmdbId);
  const activeUrl = streamUrls[server];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('moviemania_vod_server') as string;
      if (saved === 'autoembed' || saved === 'vidsrc' || saved === 'vidlink') setServer(saved as VODServer);
      else if (saved === 'multiembed') setServer('autoembed');
    } catch {}
  }, []);

  const handleSwitchServer = (s: VODServer) => {
    setServer(s);
    try { localStorage.setItem('moviemania_vod_server', s); } catch {}
  };

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
        try { window.screen?.orientation?.unlock?.(); } catch {}
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
        position: 'relative', width: '100%',
        height: isFullscreen ? '100%' : 'auto',
        aspectRatio: isFullscreen ? 'auto' : '16/9',
        background: '#000',
        borderRadius: isFullscreen ? '0' : '16px', overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid var(--border-hover)',
      }}
    >
      <div className="vod-player-header">
        <div className="vod-player-header-left">
          <div className="vod-now-playing-label">STREAMING</div>
          <div className="vod-player-title" title={title}>{title}</div>
          <span className="vod-season-pill">
            S{season}:E{episode}
          </span>
        </div>

        <div className="vod-player-header-right">
          <div className="vod-server-switcher">
            {(['vidsrc', 'vidlink', 'autoembed'] as VODServer[]).map((s) => (
              <button
                key={s}
                onClick={() => handleSwitchServer(s)}
                className={`vod-server-pill-btn ${server === s ? 'active' : ''}`}
              >
                {s === 'vidsrc' ? '⚡ VidSrc' : s === 'vidlink' ? '🌐 VidLink' : '🌍 AutoEmbed'}
              </button>
            ))}
          </div>

          {hasNextEpisode && onNextEpisode && (
            <button onClick={onNextEpisode} className="vod-next-btn">
              <SkipForward size={13} /> <span>Next</span>
            </button>
          )}

          <button onClick={toggleFullscreen} className="vod-fullscreen-btn" title={isFullscreen ? 'Exit' : 'Fullscreen'}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      <iframe
        key={activeUrl}
        src={activeUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
        allow="autoplay; fullscreen"
      />
    </div>
  );
}

export default SeriesVODPlayer;
