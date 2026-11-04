'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, SkipForward } from 'lucide-react';
import { getSeriesStreamEmbedUrl } from '@/lib/mediaUtils';

interface Props {
  seriesId: string;
  title: string;
  season: number;
  episode: number;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
}

export function SeriesVODPlayer({
  seriesId,
  title,
  season,
  episode,
  hasNextEpisode = false,
  onNextEpisode,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamUrl = getSeriesStreamEmbedUrl(seriesId, season, episode);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
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
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        background: '#000',
        borderRadius: isFullscreen ? '0' : '16px',
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid var(--border-hover)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '12px 18px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 800 }}>NOW STREAMING</div>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{title}</div>
          <div style={{ background: 'var(--accent)', color: 'var(--text-inverse)', fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
            S{season}:E{episode}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hasNextEpisode && onNextEpisode && (
            <button
              onClick={onNextEpisode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <SkipForward size={13} /> Next Episode
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      <iframe
        src={streamUrl}
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}

