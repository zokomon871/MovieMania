'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Film, Tv, Star, Layers, Search, Keyboard } from 'lucide-react';
import { ShortcutsModal } from './ShortcutsModal';

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const isMovies = pathname.startsWith('/movies');
  const isSeries = pathname.startsWith('/series');
  const isFavorites = pathname.startsWith('/favorites');
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`global-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container global-nav-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <Link href="/" className="logo-brand global-nav-logo">
              <div className="logo-icon-box">
                <Play size={18} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
              </div>
              <div className="logo-text">
                MOVIE<span className="logo-accent">MANIA</span>
              </div>
            </Link>

            <div className="global-nav-tabs">
              <Link href="/" className={`global-nav-tab ${isHome ? 'active' : ''}`}>
                <span>Home</span>
              </Link>
              <Link href="/movies" className={`global-nav-tab ${isMovies ? 'active' : ''}`}>
                <span>Movies</span>
              </Link>
              <Link href="/series" className={`global-nav-tab ${isSeries ? 'active' : ''}`}>
                <span>TV Shows</span>
              </Link>
              <Link href="/#live-directory" className="global-nav-tab">
                <span>Live TV</span>
              </Link>
              <Link href="/favorites" className={`global-nav-tab ${isFavorites ? 'active' : ''}`}>
                <span>My List</span>
              </Link>
            </div>
          </div>

          <div className="global-nav-right">
            <Link href="/movies" className="nav-icon-action" title="Search movies & shows">
              <Search size={18} />
            </Link>
            <Link href="/favorites" className="nav-icon-action" title="My Bookmarked List">
              <Star size={18} />
            </Link>
            <button onClick={() => setShowShortcuts(true)} className="nav-icon-action" title="Keyboard Shortcuts">
              <Keyboard size={18} />
            </button>
          </div>
        </div>
      </nav>

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}

export default Navigation;
