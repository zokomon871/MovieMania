'use client';

import React, { useState, useEffect } from 'react';
import { ISeries } from '@/lib/types';
import { SeriesFilterBar } from './SeriesFilterBar';
import { SeriesCard } from './SeriesCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  initialTrending: ISeries[];
  initialPopular: ISeries[];
}

export function SeriesExplorer({ initialTrending, initialPopular }: Props) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [minRating, setMinRating] = useState(0);
  const [results, setResults] = useState<ISeries[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const isFiltering = debouncedQuery.trim() !== '' || genre !== 'All' || minRating > 0 || sortBy !== 'rating';

  useEffect(() => {
    if (!isFiltering) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set('query', debouncedQuery.trim());
    if (genre !== 'All') params.set('genre', genre);
    if (sortBy !== 'rating') params.set('sortBy', sortBy);
    if (minRating > 0) params.set('minRating', String(minRating));

    fetch(`/api/series/search?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, genre, sortBy, minRating, isFiltering]);

  const handleReset = () => {
    setQuery('');
    setGenre('All');
    setSortBy('rating');
    setMinRating(0);
  };

  const displayedCount = isFiltering ? results.length : initialTrending.length + initialPopular.length;

  return (
    <div>
      <SeriesFilterBar
        searchQuery={query}
        onSearchChange={setQuery}
        selectedGenre={genre}
        onSelectGenre={setGenre}
        sortBy={sortBy}
        onSortChange={setSortBy}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        totalFound={displayedCount}
        onReset={handleReset}
      />

      {isFiltering ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {query.trim() ? `Search Results for "${query}"` : `${genre === 'All' ? 'Filtered' : genre} Series`}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {results.length} series found
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <LoadingSpinner />
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              title="No TV series found"
              message="No series matched your current search filters. Try clearing or selecting another genre."
              onReset={handleReset}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {results.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              Trending Series
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {initialTrending.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              Popular TV Shows
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {initialPopular.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

