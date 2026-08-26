'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Compass, Search, Check, X, Filter } from 'lucide-react';
import { ICategory, ICountry } from '@/lib/types';

interface FilterBarProps {
  categories: ICategory[];
  countries: ICountry[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  totalChannels: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  all: '🔥',
  sports: '⚽',
  news: '📰',
  movies: '🎬',
  entertainment: '🍿',
  music: '🎵',
  animation: '🎨',
  kids: '🧸',
  documentary: '🌍',
  science: '🚀',
  lifestyle: '🏖️',
  auto: '🏎️',
  general: '📺',
};

export default function FilterBar({
  categories,
  countries,
  selectedCategory,
  onSelectCategory,
  selectedCountry,
  onSelectCountry,
  totalChannels,
}: FilterBarProps) {
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Merge full country list
  const globalTotalChannels = countries.reduce((acc, c) => acc + (c.count || 0), 0) || totalChannels;
  const fullCountryList = [
    { code: 'ALL', name: 'All Countries (Global)', flag: '🌐', count: globalTotalChannels },
    ...countries.map((c) => ({
      code: c.code,
      name: c.name,
      flag: c.flag || '🏳️',
      count: c.count || 0,
    })),
  ];

  // Filter countries by search term
  const filteredCountries = fullCountryList.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Get active country object
  const activeCountryObj = fullCountryList.find((c) => c.code === selectedCountry) || fullCountryList[0];
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  const hasActiveCountryFilter = selectedCountry !== 'ALL';
  const hasActiveCategoryFilter = selectedCategory !== 'all';

  return (
    <div className="filter-bar-container">
      {/* Category Pills (Horizontal Scroll) */}
      <div className="filter-categories-pills">
        <button
          onClick={() => onSelectCategory('all')}
          className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
        >
          <span>🔥</span> All Channels
          {activeCountryObj.count !== undefined && activeCountryObj.count > 0 && (
            <span style={{ opacity: 0.7, fontSize: '0.75rem', marginLeft: '4px' }}>
              ({activeCountryObj.count.toLocaleString()})
            </span>
          )}
        </button>

        {categories.map((cat) => {
          const icon = CATEGORY_ICONS[cat.id] || '📺';
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`category-pill ${isActive ? 'active' : ''}`}
            >
              <span>{icon}</span> {cat.name}
              {cat.count !== undefined && cat.count > 0 && (
                <span style={{ opacity: 0.7, fontSize: '0.75rem', marginLeft: '4px' }}>
                  ({cat.count.toLocaleString()})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Country Dropdown & Clear Filter Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Custom Sleek Dark Country Selector */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCountryOpen(!isCountryOpen);
                setCountrySearch('');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: isCountryOpen ? '1px solid var(--accent-red)' : '1px solid var(--border-medium)',
                color: '#fff',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: isCountryOpen ? '0 0 14px var(--accent-red-glow)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.05rem' }}>{activeCountryObj.flag}</span>
              <span>{activeCountryObj.name}</span>
              <ChevronDown
                size={15}
                style={{
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s ease',
                  transform: isCountryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  marginLeft: '4px',
                }}
              />
            </button>

            {/* Custom Dark Dropdown Popup Menu */}
            {isCountryOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '300px',
                  maxHeight: '380px',
                  background: '#12131a',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.9)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backdropFilter: 'blur(24px)',
                }}
              >
                {/* Search Input Box */}
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px 8px 34px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Country Items Scrollable List */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((c) => {
                      const isSelected = selectedCountry === c.code;
                      return (
                        <div
                          key={c.code}
                          onClick={() => {
                            onSelectCountry(c.code);
                            setIsCountryOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(229, 9, 20, 0.15)' : 'transparent',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.86rem',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                              e.currentTarget.style.color = '#fff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                            <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.name}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {c.count !== undefined && c.count > 0 && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                {c.count}
                              </span>
                            )}
                            {isSelected && <Check size={14} color="var(--accent-red)" />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No countries found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Country Filter Reset Button */}
          {hasActiveCountryFilter && (
            <button
              onClick={() => onSelectCountry('ALL')}
              className="btn btn-ghost"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: 'var(--radius-full)',
                borderColor: 'rgba(229, 9, 20, 0.3)',
                color: 'var(--text-secondary)',
              }}
              title="Remove country filter and view all global channels"
            >
              <span>{activeCountryObj.flag} {activeCountryObj.name}</span>
              <X size={13} color="var(--accent-red)" />
            </button>
          )}
        </div>

        {/* Dynamic Context Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.86rem', fontWeight: 600 }}>
          <Compass size={16} color="var(--accent-cyan)" />
          {hasActiveCountryFilter ? (
            <span>
              Showing <strong style={{ color: '#fff' }}>{totalChannels.toLocaleString()}</strong> {activeCategoryObj?.name || (selectedCategory === 'all' ? 'Live' : '')} channels in <strong style={{ color: '#fff' }}>{activeCountryObj.name}</strong>
            </span>
          ) : (
            <span>
              Showing <strong style={{ color: '#fff' }}>{totalChannels.toLocaleString()}</strong> {activeCategoryObj?.name ? `${activeCategoryObj.name} Channels` : 'Live Channels Worldwide'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
