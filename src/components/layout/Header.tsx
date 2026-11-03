'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, HelpCircle, Flame, Trophy, Newspaper, Film, Sparkles } from 'lucide-react';
import { ShortcutsModal } from './ShortcutsModal';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoriteCount: number;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export function Header({
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navCategories = [
    { id: 'all', label: 'Discover', icon: <Flame size={15} /> },
    { id: 'sports', label: 'Sports', icon: <Trophy size={15} /> },
    { id: 'news', label: 'News', icon: <Newspaper size={15} /> },
    { id: 'movies', label: 'Movies', icon: <Film size={15} /> },
    { id: 'animation', label: 'Kids & Anime', icon: <Sparkles size={15} /> },
  ];

  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          <nav className="nav-links-menu" style={{ display: 'flex', gap: '8px' }}>
            {navCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  if (showFavoritesOnly) onToggleFavoritesOnly();
                  onSelectCategory(c.id);
                }}
                className={`nav-link-btn ${!showFavoritesOnly && selectedCategory === c.id ? 'active' : ''}`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="header-search-box" style={{ position: 'relative' }}>
              <Search size={16} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search live channels... (Press '/')"
                className="header-search-input"
                style={{ paddingLeft: '38px', paddingRight: '32px' }}
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={onToggleFavoritesOnly}
              className={`header-fav-btn ${showFavoritesOnly ? 'active' : ''}`}
              title="Show Bookmarked Channels"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Star size={16} fill={showFavoritesOnly ? 'var(--accent)' : 'transparent'} color={showFavoritesOnly ? 'var(--accent)' : 'currentColor'} />
              <span>{favoriteCount}</span>
            </button>

            <button onClick={() => setShowShortcuts(true)} className="icon-btn-ghost" title="Keyboard Shortcuts">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </div>
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </header>
  );
}
export default Header;

