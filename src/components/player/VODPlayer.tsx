'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface VODPlayerProps {
  tmdbId: string | number;
  title: string;
}

export function VODPlayer({ tmdbId, title }: VODPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamUrl = `https://vidsrc.mov/embed/movie/${tmdbId}`;

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
          padding: '20px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/movies"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 800 }}>NOW PLAYING</div>
            <h1 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{title}</h1>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      <iframe src={streamUrl} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen allow="autoplay; fullscreen" />
    </div>
  );
}
export default VODPlayer;

