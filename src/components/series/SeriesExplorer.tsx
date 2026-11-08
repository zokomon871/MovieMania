'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Tv } from 'lucide-react';
import { ISeries } from '@/lib/types';
import { SeriesFilterBar } from './SeriesFilterBar';
import { SeriesCard } from './SeriesCard';
import { MediaRow } from '@/components/common/MediaRow';
import { MediaModal } from '@/components/common/MediaModal';
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
  const [selectedSeries, setSelectedSeries] = useState<ISeries | null>(null);

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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{results.length} series found</span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><LoadingSpinner /></div>
          ) : results.length === 0 ? (
            <EmptyState
              title="No TV series found"
              message="No series matched your current filters. Try clearing or selecting another genre."
              onReset={handleReset}
            />
          ) : (
            <div className="vod-grid">
              {results.map((s) => (
                <SeriesCard key={s.id} series={s} onSelect={() => setSelectedSeries(s)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <MediaRow
            title="Trending TV Shows"
            icon={<Flame size={20} color="var(--accent)" />}
            items={initialTrending}
            type="series"
            onSelectMedia={(item) => setSelectedSeries(item as ISeries)}
          />

          <MediaRow
            title="Top 10 Series Today"
            icon={<Trophy size={20} color="var(--accent)" />}
            items={initialTrending.slice(0, 10)}
            type="series"
            showRank={true}
            onSelectMedia={(item) => setSelectedSeries(item as ISeries)}
          />

          <MediaRow
            title="Popular TV Shows"
            icon={<Tv size={20} color="var(--accent)" />}
            items={initialPopular}
            type="series"
            onSelectMedia={(item) => setSelectedSeries(item as ISeries)}
          />
        </>
      )}

      <MediaModal
        item={selectedSeries}
        type="series"
        isOpen={Boolean(selectedSeries)}
        onClose={() => setSelectedSeries(null)}
      />
    </div>
  );
}
