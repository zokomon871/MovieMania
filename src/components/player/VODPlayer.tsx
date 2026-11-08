'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { VODServer, getMovieStreamUrls } from '@/lib/mediaUtils';

interface VODPlayerProps {
  tmdbId?: string | number;
  imdbId?: string | number;
  title: string;
}

export function VODPlayer({ tmdbId, imdbId, title }: VODPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [server, setServer] = useState<VODServer>('vidsrc');

  const streamUrls = getMovieStreamUrls(imdbId || tmdbId || '', tmdbId);
  const activeUrl = streamUrls[server];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('moviemania_vod_server') as VODServer;
      if (saved && (saved === 'vidsrc' || saved === 'vidlink')) setServer(saved);
    } catch {}
  }, []);

  const handleSwitchServer = (s: VODServer) => {
    setServer(s);
    try { localStorage.setItem('moviemania_vod_server', s); } catch {}
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(console.error);
    else document.exitFullscreen().catch(console.error);
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      className={`cinema-player-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000',
        borderRadius: isFullscreen ? '0' : '16px', overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid var(--border-hover)',
      }}
    >
      <div className="vod-player-header">
        <div className="vod-player-header-left">
          <Link href="/movies" className="vod-back-btn">
            <ArrowLeft size={18} />
          </Link>
          <div className="vod-title-container">
            <div className="vod-now-playing-label">NOW PLAYING</div>
            <h1 className="vod-player-title" title={title}>{title}</h1>
          </div>
        </div>

        <div className="vod-player-header-right">
          <div className="vod-server-switcher">
            {(['vidsrc', 'vidlink'] as VODServer[]).map((s) => (
              <button
                key={s}
                onClick={() => handleSwitchServer(s)}
                className={`vod-server-pill-btn ${server === s ? 'active' : ''}`}
              >
                {s === 'vidsrc' ? '⚡ VidSrc' : '🌐 VidLink'}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="vod-fullscreen-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
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

export default VODPlayer;
