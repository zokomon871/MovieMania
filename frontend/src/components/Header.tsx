'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, Star, HelpCircle, Film, Radio, Tv, Flame, Trophy, Newspaper } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoriteCount: number;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  favoriteCount,
  selectedCategory,
  onSelectCategory,
}: HeaderProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global hotkey shortcut: pressing '/' focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts]);

  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          {/* Logo Brand Removed - Now in Navigation */}

          {/* Quick Nav Links (1Flex Style) */}
          <nav className="nav-links-menu" style={{ display: 'flex' }}>
            <button
              onClick={() => {
                if (showFavoritesOnly) onToggleFavoritesOnly();
                onSelectCategory('all');
              }}
              className={`nav-link-btn ${!showFavoritesOnly && selectedCategory === 'all' ? 'active' : ''}`}
            >
              <Flame size={15} color={!showFavoritesOnly && selectedCategory === 'all' ? 'var(--accent-red)' : 'currentColor'} />
              <span>Discover</span>
            </button>

            <button
              onClick={() => {
                if (showFavoritesOnly) onToggleFavoritesOnly();
                onSelectCategory('sports');
              }}
              className={`nav-link-btn ${!showFavoritesOnly && selectedCategory === 'sports' ? 'active' : ''}`}
            >
              <Trophy size={15} />
              <span>Sports</span>
            </button>

            <button
              onClick={() => {
                if (showFavoritesOnly) onToggleFavoritesOnly();
                onSelectCategory('news');
              }}
              className={`nav-link-btn ${!showFavoritesOnly && selectedCategory === 'news' ? 'active' : ''}`}
            >
              <Newspaper size={15} />
              <span>News</span>
            </button>

            <button
              onClick={() => {
                if (showFavoritesOnly) onToggleFavoritesOnly();
                onSelectCategory('movies');
              }}
              className={`nav-link-btn ${!showFavoritesOnly && selectedCategory === 'movies' ? 'active' : ''}`}
            >
              <Film size={15} />
              <span>Movies</span>
            </button>

            <button
              onClick={() => {
                if (showFavoritesOnly) onToggleFavoritesOnly();
                onSelectCategory('kids');
              }}
              className={`nav-link-btn ${!showFavoritesOnly && selectedCategory === 'kids' ? 'active' : ''}`}
            >
              <Tv size={15} />
              <span>Kids</span>
            </button>
          </nav>

          {/* Search Bar with '/' hotkey */}
          <div className="search-wrapper">
            <Search className="search-icon-left" size={17} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search 10,000+ live channels, sports, news..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {searchQuery ? (
              <button
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="search-hotkey-badge">/</span>
            )}
          </div>

          {/* Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Favorites Toggle */}
            <button
              onClick={onToggleFavoritesOnly}
              className={`btn btn-ghost ${showFavoritesOnly ? 'active' : ''}`}
              title="Filter Starred Channels"
              style={{ padding: '8px 14px' }}
            >
              <Star size={15} fill={showFavoritesOnly ? 'var(--accent-gold)' : 'transparent'} color={showFavoritesOnly ? 'var(--accent-gold)' : 'currentColor'} />
              <span>Saved ({favoriteCount})</span>
            </button>

            {/* Keyboard Shortcuts Dialog Trigger */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="btn btn-ghost"
              style={{ padding: '8px 10px' }}
              title="Shortcuts"
            >
              <HelpCircle size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '460px',
              width: '90%',
              padding: '28px',
              border: '1px solid var(--border-medium)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tv size={20} color="var(--accent-red)" />
                <h3 className="font-display" style={{ fontSize: '1.6rem', color: '#fff' }}>Keyboard Shortcuts</h3>
              </div>
              <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={() => setShowShortcuts(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.92rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Focus Search</span>
                <kbd style={{ background: '#1c1e29', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}>/</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Play / Pause</span>
                <kbd style={{ background: '#1c1e29', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}>Space</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Toggle Fullscreen</span>
                <kbd style={{ background: '#1c1e29', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}>F</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mute / Unmute Audio</span>
                <kbd style={{ background: '#1c1e29', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}>M</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Picture-in-Picture (PiP)</span>
                <kbd style={{ background: '#1c1e29', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}>P</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
