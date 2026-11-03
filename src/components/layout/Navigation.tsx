'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Film, Tv, Star } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const isMovies = pathname.startsWith('/movies');
  const isFavorites = pathname.startsWith('/favorites');
  const isHome = pathname === '/';

  return (
    <nav className="global-nav">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <Link href="/" className="logo-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ background: 'var(--accent)', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={18} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            MOVIE<span style={{ color: 'var(--accent)' }}>MANIA</span>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              background: isHome ? 'var(--accent)' : 'transparent',
              color: isHome ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <Tv size={16} /> Live TV
          </Link>

          <Link
            href="/movies"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              background: isMovies ? 'var(--accent)' : 'transparent',
              color: isMovies ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <Film size={16} /> VOD Cinema
          </Link>

          <Link
            href="/favorites"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              background: isFavorites ? 'var(--accent)' : 'transparent',
              color: isFavorites ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <Star size={16} /> Bookmarks
          </Link>
        </div>
      </div>
    </nav>
  );
}
export default Navigation;

