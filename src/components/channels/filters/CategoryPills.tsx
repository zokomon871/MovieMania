import React from 'react';
import { ICategory } from '@/lib/types';

interface CategoryPillsProps {
  categories: ICategory[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
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
  general: '📺',
};

export function CategoryPills({
  categories,
  selectedCategory,
  onSelectCategory,
  totalChannels,
}: CategoryPillsProps) {
  return (
    <div className="filter-categories-pills">
      <button
        onClick={() => onSelectCategory('all')}
        className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
      >
        <span>🔥</span> All Channels
        {totalChannels > 0 && (
          <span style={{ opacity: 0.7, fontSize: '0.75rem', marginLeft: '4px' }}>
            ({totalChannels.toLocaleString()})
          </span>
        )}
      </button>

      {categories.map((cat) => {
        const icon = CATEGORY_ICONS[cat.id.toLowerCase()] || '📺';
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
  );
}

