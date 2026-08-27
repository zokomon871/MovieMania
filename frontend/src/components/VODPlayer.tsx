'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface VODPlayerProps {
  tmdbId: string;
  title: string;
}

export default function VODPlayer({ tmdbId, title }: VODPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>('');

  useEffect(() => {
    // Fetch the streaming provider URL securely from our backend
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    fetch(`${BACKEND_URL}/api/movies/${tmdbId}/stream`)
      .then(res => res.json())
      .then(data => {
        if (data.url) setStreamUrl(data.url);
      })
      .catch(err => console.error("Failed to fetch stream source:", err));
  }, [tmdbId]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
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
        border: isFullscreen ? 'none' : '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Bar Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '24px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/movies" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', width: '40px', height: '40px', borderRadius: '50%', color: '#fff', textDecoration: 'none', transition: 'background 0.2s' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div style={{ color: 'var(--accent-red)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
              NOW PLAYING
            </div>
            <h1 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              {title}
            </h1>
          </div>
        </div>

        <button 
          onClick={handleToggleFullscreen}
          style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Vidsrc iframe */}
      {streamUrl ? (
        <iframe 
          src={streamUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Loading secure stream...
        </div>
      )}
    </div>
  );
}
