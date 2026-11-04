'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export const SERIES_GENRES = [
  'All', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Mystery', 'Sci-Fi', 'Thriller'
];

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGenre: string;
  onSelectGenre: (g: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  minRating: number;
  onMinRatingChange: (r: number) => void;
  totalFound: number;
  onReset: () => void;
}

export function SeriesFilterBar({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onSelectGenre,
  sortBy,
  onSortChange,
  minRating,
  onMinRatingChange,
  totalFound,
  onReset,
}: Props) {
  const hasActiveFilters = searchQuery.trim() !== '' || selectedGenre !== 'All' || minRating > 0 || sortBy !== 'rating';

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '640px', marginBottom: '16px' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search TV series, shows, anime..."
          style={{
            width: '100%',
            padding: '14px 44px 14px 48px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            color: 'var(--text)',
            fontSize: '0.95rem',
            outline: 'none',
            boxShadow: 'var(--shadow-sm)',
          }}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }}>
        {SERIES_GENRES.map((g) => {
          const active = selectedGenre === g;
          return (
            <button
              key={g}
              onClick={() => onSelectGenre(g)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                background: active ? 'var(--accent)' : 'var(--bg-surface)',
                color: active ? 'var(--text-inverse)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--duration-fast) var(--ease)',
              }}
            >
              {g}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
            <ArrowUpDown size={14} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}
            >
              <option value="rating" style={{ background: '#18181b' }}>Highest Rated</option>
              <option value="year" style={{ background: '#18181b' }}>Newest</option>
              <option value="title" style={{ background: '#18181b' }}>Title (A–Z)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <select
              value={minRating}
              onChange={(e) => onMinRatingChange(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}
            >
              <option value={0} style={{ background: '#18181b' }}>All Ratings</option>
              <option value={8} style={{ background: '#18181b' }}>8.0+ Stars</option>
              <option value={7} style={{ background: '#18181b' }}>7.0+ Stars</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{totalFound}</strong> series
        </div>
      </div>
    </div>
  );
}

