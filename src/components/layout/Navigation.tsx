'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Film, Tv, Star, Layers } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const isMovies = pathname.startsWith('/movies');
  const isSeries = pathname.startsWith('/series');
  const isFavorites = pathname.startsWith('/favorites');
  const isHome = pathname === '/';

  return (
    <nav className="global-nav">
      <div className="container global-nav-container">
        <Link href="/" className="logo-brand global-nav-logo">
          <div className="logo-icon-box">
            <Play size={18} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
          </div>
          <div className="logo-text">
            MOVIE<span className="logo-accent">MANIA</span>
          </div>
        </Link>

        <div className="global-nav-tabs">
          <Link
            href="/"
            className={`global-nav-tab ${isHome ? 'active' : ''}`}
          >
            <Tv size={16} />
            <span className="global-nav-label">Live TV</span>
          </Link>

          <Link
            href="/movies"
            className={`global-nav-tab ${isMovies ? 'active' : ''}`}
          >
            <Film size={16} />
            <span className="global-nav-label">Movies</span>
          </Link>

          <Link
            href="/series"
            className={`global-nav-tab ${isSeries ? 'active' : ''}`}
          >
            <Layers size={16} />
            <span className="global-nav-label">Series</span>
          </Link>

          <Link
            href="/favorites"
            className={`global-nav-tab ${isFavorites ? 'active' : ''}`}
          >
            <Star size={16} />
            <span className="global-nav-label">Bookmarks</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
