'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Tv, Clapperboard, Compass, Film } from 'lucide-react';
import { ISeries } from '@/lib/types';
import { NetflixSubNav } from '@/components/common/NetflixSubNav';
import { NetflixRow, RowMediaItem } from '@/components/home/NetflixRow';
import { SeriesCard } from './SeriesCard';
import { MediaModal } from '@/components/common/MediaModal';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const SERIES_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Mystery',
  'Sci-Fi',
  'Thriller',
];

interface Props {
  initialTrending: ISeries[];
  initialPopular: ISeries[];
}

export function SeriesExplorer({ initialTrending, initialPopular }: Props) {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'rows' | 'grid'>('rows');
  const [results, setResults] = useState<ISeries[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<ISeries | null>(null);

  // Curated genre rows for Netflix TV Series browsing
  const [dramaSeries, setDramaSeries] = useState<ISeries[]>([]);
  const [actionSeries, setActionSeries] = useState<ISeries[]>([]);
  const [comedySeries, setComedySeries] = useState<ISeries[]>([]);
  const [crimeSeries, setCrimeSeries] = useState<ISeries[]>([]);
  const [animationSeries, setAnimationSeries] = useState<ISeries[]>([]);

  useEffect(() => {
    fetch('/api/series/search?genre=Drama&limit=15').then((r) => r.json()).then((d) => setDramaSeries(d.results || [])).catch(() => {});
    fetch('/api/series/search?genre=Action&limit=15').then((r) => r.json()).then((d) => setActionSeries(d.results || [])).catch(() => {});
    fetch('/api/series/search?genre=Comedy&limit=15').then((r) => r.json()).then((d) => setComedySeries(d.results || [])).catch(() => {});
    fetch('/api/series/search?genre=Crime&limit=15').then((r) => r.json()).then((d) => setCrimeSeries(d.results || [])).catch(() => {});
    fetch('/api/series/search?genre=Animation&limit=15').then((r) => r.json()).then((d) => setAnimationSeries(d.results || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedGenre === 'All' && viewMode === 'rows') {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedGenre !== 'All') params.set('genre', selectedGenre);
    if (sortBy) params.set('sortBy', sortBy);

    fetch(`/api/series/search?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [selectedGenre, sortBy, viewMode]);

  const handleSelectMedia = (item: any) => {
    setSelectedSeries(item);
  };

  const toRowItems = (seriesList: ISeries[]): RowMediaItem[] =>
    seriesList.map((s) => ({
      id: String(s.id),
      type: 'series',
      title: s.title,
      poster: s.poster,
      backdrop: s.backdrop,
      rating: s.rating,
      year: String(s.year || '').substring(0, 4),
    }));

  const top10 = initialPopular.slice(0, 10);
  const isFiltered = selectedGenre !== 'All' || viewMode === 'grid';
  const displayedCount = isFiltered ? results.length : initialTrending.length + initialPopular.length;

  return (
    <div>
      {/* ─── Netflix Sub-Navigation (Title + Genre Dropdown + View Mode) ─── */}
      <NetflixSubNav
        title="TV Shows"
        genres={SERIES_GENRES}
        selectedGenre={selectedGenre}
        onSelectGenre={setSelectedGenre}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={displayedCount}
      />

      {/* ─── Filtered Grid View ─── */}
      {isFiltered ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {selectedGenre === 'All' ? 'All TV Shows' : `${selectedGenre} Series`}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {results.length} titles found
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <LoadingSpinner />
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              title="No TV series found"
              message={`No TV shows found for ${selectedGenre}. Try selecting another genre.`}
              onReset={() => setSelectedGenre('All')}
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '20px',
              }}
            >
              {results.map((s) => (
                <SeriesCard key={s.id} series={s} onSelect={() => setSelectedSeries(s)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── Netflix Curated Rows View (Default) ─── */
        <>
          {/* Trending Series */}
          {initialTrending.length > 0 && (
            <NetflixRow
              title="Trending TV Shows"
              icon={<Flame size={22} color="var(--accent)" />}
              items={toRowItems(initialTrending)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Top 10 TV Shows Today */}
          {top10.length > 0 && (
            <NetflixRow
              title="Top 10 TV Shows Today"
              icon={<Trophy size={22} color="#f59e0b" />}
              items={toRowItems(top10)}
              isTop10={true}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Binge-Worthy Dramas */}
          {dramaSeries.length > 0 && (
            <NetflixRow
              title="Binge-Worthy TV Dramas"
              icon={<Film size={22} color="var(--accent)" />}
              items={toRowItems(dramaSeries)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Action & Sci-Fi */}
          {actionSeries.length > 0 && (
            <NetflixRow
              title="Action & Sci-Fi Television"
              icon={<Compass size={22} color="var(--accent)" />}
              items={toRowItems(actionSeries)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Crime & Mystery */}
          {crimeSeries.length > 0 && (
            <NetflixRow
              title="Crime, Heists & Mystery Shows"
              icon={<Clapperboard size={22} color="var(--accent)" />}
              items={toRowItems(crimeSeries)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Comedy Series */}
          {comedySeries.length > 0 && (
            <NetflixRow
              title="Comedy Series & Sitcoms"
              icon={<Tv size={22} color="var(--accent)" />}
              items={toRowItems(comedySeries)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Anime & Animation */}
          {animationSeries.length > 0 && (
            <NetflixRow
              title="Anime & Animated Series"
              icon={<Film size={22} color="var(--accent)" />}
              items={toRowItems(animationSeries)}
              onSelectMedia={handleSelectMedia}
            />
          )}
        </>
      )}

      {/* Netflix Quick-Preview Modal */}
      <MediaModal
        item={selectedSeries}
        type="series"
        isOpen={!!selectedSeries}
        onClose={() => setSelectedSeries(null)}
      />
    </div>
  );
}

export default SeriesExplorer;
