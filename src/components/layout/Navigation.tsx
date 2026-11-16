'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Search, Star, Keyboard, User, Sparkles, LogOut, ChevronDown, Check } from 'lucide-react';
import { ShortcutsModal } from './ShortcutsModal';
import { GlobalSearchModal } from '@/components/common/GlobalSearchModal';
import { useFavorites } from '@/hooks/useFavorites';

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { favorites } = useFavorites();

  const isMovies = pathname.startsWith('/movies');
  const isSeries = pathname.startsWith('/series');
  const isAnime = pathname.startsWith('/anime');
  const isFavorites = pathname.startsWith('/favorites');
  const isHome = pathname === '/' || pathname === '/browse';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut listener for Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav
        className={`global-nav ${isScrolled ? 'scrolled' : ''}`}
        style={{
          background: isScrolled
            ? 'rgba(20, 20, 20, 0.96)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
          backdropFilter: isScrolled ? 'blur(16px)' : 'none',
          transition: 'background 0.35s ease, backdrop-filter 0.35s ease',
        }}
      >
        <div className="container global-nav-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* Netflix/MovieMate Style Logo */}
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(1.8rem, 3vw, 2.3rem)',
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  color: '#E50914',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  textShadow: '0 2px 10px rgba(229, 9, 20, 0.4)',
                }}
              >
                MOVIEMATE
              </div>
            </Link>

            {/* Nav Tabs */}
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
              <Link href="/anime" className={`global-nav-tab ${isAnime ? 'active' : ''}`}>
                <span>Anime</span>
              </Link>
              <Link href="/#live-directory" className="global-nav-tab">
                <span>Live TV</span>
              </Link>
              <Link href="/favorites" className={`global-nav-tab ${isFavorites ? 'active' : ''}`}>
                <span>My List</span>
                {favorites.length > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '0.72rem',
                      background: 'var(--accent)',
                      color: '#fff',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 800,
                    }}
                  >
                    {favorites.length}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Right Actions */}
          <div className="global-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search Trigger Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="nav-search-btn"
              title="Search (Press Ctrl+K or /)"
            >
              <Search size={15} color="var(--text-secondary)" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Search...
              </span>
              <kbd
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'inherit',
                  color: 'rgba(255, 255, 255, 0.6)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  lineHeight: '1.2',
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Bookmarks */}
            <Link href="/favorites" className="nav-icon-action" title="My Bookmarks">
              <Star
                size={18}
                fill={favorites.length > 0 ? 'var(--accent)' : 'none'}
                color={favorites.length > 0 ? 'var(--accent)' : 'currentColor'}
              />
            </Link>

            {/* Shortcuts */}
            <button
              onClick={() => setShowShortcuts(true)}
              className="nav-icon-action"
              title="Keyboard Shortcuts"
            >
              <Keyboard size={18} />
            </button>

            {/* Netflix Profile Avatar Dropdown */}
            <div ref={profileMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  background: '#E50914',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  padding: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
                title="Account & Settings"
              >
                <img
                  src="https://wallpapers.com/images/high/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.webp"
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <User size={18} />
              </button>

              {showProfileMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '200px',
                    background: 'rgba(20, 20, 20, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 0',
                    zIndex: 250,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
                  }}
                >
                  <Link
                    href="/favorites"
                    onClick={() => setShowProfileMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Star size={16} color="var(--accent)" />
                    <span>My List ({favorites.length})</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowShortcuts(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      color: '#fff',
                      background: 'none',
                      border: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      width: '100%',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Keyboard size={16} />
                    <span>Shortcuts</span>
                  </button>

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

                  <div style={{ padding: '8px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    MovieMate v2.0 • Ultra HD
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <GlobalSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </>
  );
}

export default Navigation;
