'use client';

import React from 'react';
import { ICategory, ICountry } from '@/lib/types';
import { CategoryPills } from './CategoryPills';
import { CountryDropdown } from './CountryDropdown';
import { X } from 'lucide-react';

interface FilterBarProps {
  categories: ICategory[];
  countries: ICountry[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  totalChannels: number;
}

export function FilterBar({
  categories,
  countries,
  selectedCategory,
  onSelectCategory,
  selectedCountry,
  onSelectCountry,
  totalChannels,
}: FilterBarProps) {
  const hasActiveFilter = selectedCategory !== 'all' || selectedCountry !== 'ALL';

  return (
    <div className="filter-bar-container">
      <CategoryPills
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        totalChannels={totalChannels}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CountryDropdown
            countries={countries}
            selectedCountry={selectedCountry}
            onSelectCountry={onSelectCountry}
            totalChannels={totalChannels}
          />

          {hasActiveFilter && (
            <button
              onClick={() => {
                onSelectCategory('all');
                onSelectCountry('ALL');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{totalChannels.toLocaleString()}</strong> Channels
        </div>
      </div>
    </div>
  );
}
export default FilterBar;

