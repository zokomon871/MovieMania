'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, LayoutGrid, Rows3, ArrowUpDown, X } from 'lucide-react';

interface Props {
  title: string;
  genres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  viewMode?: 'rows' | 'grid';
  onViewModeChange?: (mode: 'rows' | 'grid') => void;
  totalCount?: number;
}

export function NetflixSubNav({
  title,
  genres,
  selectedGenre,
  onSelectGenre,
  sortBy = 'rating',
  onSortChange,
  viewMode = 'rows',
  onViewModeChange,
  totalCount,
}: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      {/* Left: Title + Netflix Genre Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>

        {/* Netflix-style Genre Picker Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: selectedGenre !== 'All' ? 'var(--accent)' : 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '7px 14px',
              borderRadius: '4px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span>{selectedGenre === 'All' ? 'Genres' : selectedGenre}</span>
            <ChevronDown size={16} />
          </button>

          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                background: 'rgba(20, 20, 20, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '16px',
                minWidth: '320px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                zIndex: 100,
                boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onSelectGenre('All');
                  setIsDropdownOpen(false);
                }}
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: selectedGenre === 'All' ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: selectedGenre === 'All' ? 800 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>All {title}</span>
                {selectedGenre === 'All' && <Check size={16} color="var(--accent)" />}
              </button>

              {genres
                .filter((g) => g !== 'All')
                .map((g) => {
                  const isSelected = selectedGenre === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        onSelectGenre(g);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: isSelected ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <span>{g}</span>
                      {isSelected && <Check size={14} color="var(--accent)" />}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Clear genre badge if selected */}
        {selectedGenre !== 'All' && (
          <button
            type="button"
            onClick={() => onSelectGenre('All')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '20px',
              padding: '4px 12px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>Reset filter</span>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Right: View Mode & Sorting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {totalCount !== undefined && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {totalCount.toLocaleString()} Titles
          </span>
        )}

        {/* Sort selector */}
        {onSortChange && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '6px 12px',
              borderRadius: '4px',
            }}
          >
            <ArrowUpDown size={14} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="rating" style={{ background: '#1c1c1c' }}>Highest Rated</option>
              <option value="year" style={{ background: '#1c1c1c' }}>Newest Releases</option>
              <option value="title" style={{ background: '#1c1c1c' }}>Alphabetical (A-Z)</option>
            </select>
          </div>
        )}

        {/* View Switch: Rows vs Grid */}
        {onViewModeChange && selectedGenre === 'All' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => onViewModeChange('rows')}
              style={{
                background: viewMode === 'rows' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                padding: '6px 10px',
                color: '#fff',
                cursor: 'pointer',
              }}
              title="Row Shelves View"
            >
              <Rows3 size={16} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              style={{
                background: viewMode === 'grid' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                padding: '6px 10px',
                color: '#fff',
                cursor: 'pointer',
              }}
              title="Poster Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NetflixSubNav;
