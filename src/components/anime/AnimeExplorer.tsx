'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Film, Sparkles, Compass } from 'lucide-react';
import { ITMDBMovie, ISeries } from '@/lib/types';
import { NetflixSubNav } from '@/components/common/NetflixSubNav';
import { NetflixRow, RowMediaItem } from '@/components/home/NetflixRow';
import { MovieCard } from '@/components/movies/MovieCard';
import { SeriesCard } from '@/components/series/SeriesCard';
import { MediaModal } from '@/components/common/MediaModal';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const ANIME_GENRES = ['All', 'Action', 'Adventure', 'Fantasy', 'Comedy', 'Drama', 'Sci-Fi', 'Romance'];

interface Props {
  initialMovies: ITMDBMovie[];
  initialSeries: ISeries[];
}

export function AnimeExplorer({ initialMovies, initialSeries }: Props) {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'rows' | 'grid'>('rows');
  const [results, setResults] = useState<(ITMDBMovie | ISeries)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Additional anime shelves
  const [actionAnime, setActionAnime] = useState<ISeries[]>([]);
  const [fantasyAnime, setFantasyAnime] = useState<ISeries[]>([]);

  useEffect(() => {
    fetch('/api/series/search?genre=Action&limit=15').then((r) => r.json()).then((d) => setActionAnime(d.results || [])).catch(() => {});
    fetch('/api/series/search?genre=Fantasy&limit=15').then((r) => r.json()).then((d) => setFantasyAnime(d.results || [])).catch(() => {});
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

    Promise.all([
      fetch(`/api/series/search?${params.toString()}`).then((r) => r.json()).then((d) => d.results || []).catch(() => []),
      fetch(`/api/movies/search?${params.toString()}`).then((r) => r.json()).then((d) => d.results || []).catch(() => []),
    ])
      .then(([seriesRes, moviesRes]) => {
        setResults([...seriesRes, ...moviesRes]);
      })
      .finally(() => setIsLoading(false));
  }, [selectedGenre, sortBy, viewMode]);

  const toRowItems = (itemsList: (ITMDBMovie | ISeries)[]): RowMediaItem[] =>
    itemsList.map((item: any) => ({
      id: String(item.id),
      type: item.seasonsCount !== undefined || item.episodes !== undefined ? 'series' : 'movie',
      title: item.title,
      poster: item.poster || item.poster_path,
      backdrop: item.backdrop || item.backdrop_path,
      rating: item.rating || item.vote_average,
      year: String(item.year || item.release_date || '').substring(0, 4),
    }));

  const top10 = initialSeries.slice(0, 10);
  const isFiltered = selectedGenre !== 'All' || viewMode === 'grid';
  const displayedCount = isFiltered ? results.length : initialMovies.length + initialSeries.length;

  return (
    <div>
      <NetflixSubNav
        title="Anime"
        genres={ANIME_GENRES}
        selectedGenre={selectedGenre}
        onSelectGenre={setSelectedGenre}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={displayedCount}
      />

      {isFiltered ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {selectedGenre === 'All' ? 'All Anime' : `${selectedGenre} Anime`}
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
              title="No anime found"
              message={`No titles found for ${selectedGenre}. Try selecting another genre.`}
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
              {results.map((item: any) => {
                const isSeries = item.seasonsCount !== undefined || item.episodes !== undefined;
                return isSeries ? (
                  <SeriesCard key={item.id} series={item} onSelect={() => setSelectedItem(item)} />
                ) : (
                  <MovieCard key={item.id} movie={item} onSelect={() => setSelectedItem(item)} />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Anime Series */}
          {initialSeries.length > 0 && (
            <NetflixRow
              title="Popular Anime Series"
              icon={<Flame size={22} color="var(--accent)" />}
              items={toRowItems(initialSeries)}
              onSelectMedia={(item) => setSelectedItem(item)}
            />
          )}

          {/* Top 10 Anime Today */}
          {top10.length > 0 && (
            <NetflixRow
              title="Top 10 Anime Today"
              icon={<Trophy size={22} color="#f59e0b" />}
              items={toRowItems(top10)}
              isTop10={true}
              onSelectMedia={(item) => setSelectedItem(item)}
            />
          )}

          {/* Action Anime */}
          {actionAnime.length > 0 && (
            <NetflixRow
              title="Action & Shonen Anime"
              icon={<Sparkles size={22} color="var(--accent)" />}
              items={toRowItems(actionAnime)}
              onSelectMedia={(item) => setSelectedItem(item)}
            />
          )}

          {/* Anime Feature Films */}
          {initialMovies.length > 0 && (
            <NetflixRow
              title="Top Rated Anime Films"
              icon={<Film size={22} color="var(--accent)" />}
              items={toRowItems(initialMovies)}
              onSelectMedia={(item) => setSelectedItem(item)}
            />
          )}

          {/* Fantasy & Supernatural */}
          {fantasyAnime.length > 0 && (
            <NetflixRow
              title="Fantasy & Supernatural Anime"
              icon={<Compass size={22} color="var(--accent)" />}
              items={toRowItems(fantasyAnime)}
              onSelectMedia={(item) => setSelectedItem(item)}
            />
          )}
        </>
      )}

      <MediaModal
        item={selectedItem}
        type={selectedItem?.seasonsCount !== undefined ? 'series' : 'movie'}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default AnimeExplorer;
