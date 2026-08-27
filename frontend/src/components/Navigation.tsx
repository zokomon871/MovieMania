'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Film, Tv } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const isMovies = pathname.startsWith('/movies');
  
  return (
    <nav className="global-nav">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px' }}>
        <Link href="/" className="logo-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div className="logo-icon-badge" style={{ background: 'var(--accent-red)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={16} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
          </div>
          <div className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            STREAM<span style={{ color: 'var(--accent-red)' }}>HUB</span>
          </div>
        </Link>

        <div className="nav-tabs" style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <Link 
            href="/" 
            className={`nav-tab ${!isMovies ? 'active' : ''}`}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
              background: !isMovies ? 'var(--accent-red)' : 'transparent',
              color: !isMovies ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <Tv size={16} />
            Live TV
          </Link>
          
          <Link 
            href="/movies" 
            className={`nav-tab ${isMovies ? 'active' : ''}`}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
              background: isMovies ? 'var(--accent-red)' : 'transparent',
              color: isMovies ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <Film size={16} />
            VOD Movies
          </Link>
        </div>
      </div>
    </nav>
  );
}
