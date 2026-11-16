'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Film, Clapperboard, Compass } from 'lucide-react';
import { ITMDBMovie } from '@/lib/types';
import { NetflixSubNav } from '@/components/common/NetflixSubNav';
import { NetflixRow, RowMediaItem } from '@/components/home/NetflixRow';
import { MovieCard } from './MovieCard';
import { MovieHero } from './MovieHero';
import { MediaModal } from '@/components/common/MediaModal';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const MOVIE_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
];

interface Props {
  heroMovie?: ITMDBMovie;
  initialTrending: ITMDBMovie[];
  initialPopular: ITMDBMovie[];
}

export function MoviesExplorer({ heroMovie, initialTrending, initialPopular }: Props) {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'rows' | 'grid'>('rows');
  const [results, setResults] = useState<ITMDBMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<ITMDBMovie | null>(null);

  // Curated genre rows for Netflix-style browsing
  const [actionMovies, setActionMovies] = useState<ITMDBMovie[]>([]);
  const [scifiMovies, setScifiMovies] = useState<ITMDBMovie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<ITMDBMovie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<ITMDBMovie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<ITMDBMovie[]>([]);
  const [animationMovies, setAnimationMovies] = useState<ITMDBMovie[]>([]);

  // Fetch genre shelves in the background for rows view
  useEffect(() => {
    fetch('/api/movies/search?genre=Action&limit=15').then((r) => r.json()).then((d) => setActionMovies(d.results || [])).catch(() => {});
    fetch('/api/movies/search?genre=Sci-Fi&limit=15').then((r) => r.json()).then((d) => setScifiMovies(d.results || [])).catch(() => {});
    fetch('/api/movies/search?genre=Comedy&limit=15').then((r) => r.json()).then((d) => setComedyMovies(d.results || [])).catch(() => {});
    fetch('/api/movies/search?genre=Horror&limit=15').then((r) => r.json()).then((d) => setHorrorMovies(d.results || [])).catch(() => {});
    fetch('/api/movies/search?genre=Drama&limit=15').then((r) => r.json()).then((d) => setDramaMovies(d.results || [])).catch(() => {});
    fetch('/api/movies/search?genre=Animation&limit=15').then((r) => r.json()).then((d) => setAnimationMovies(d.results || [])).catch(() => {});
  }, []);

  // Fetch when genre is selected or sorted
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

    fetch(`/api/movies/search?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [selectedGenre, sortBy, viewMode]);

  const handleSelectMedia = (item: any) => {
    setSelectedMovie(item);
  };

  const toRowItems = (moviesList: ITMDBMovie[]): RowMediaItem[] =>
    moviesList.map((m) => ({
      id: String(m.id),
      type: 'movie',
      title: m.title,
      poster: m.poster_path,
      backdrop: m.backdrop_path,
      rating: m.vote_average,
      year: String(m.release_date || '').substring(0, 4),
    }));

  const top10 = initialPopular.slice(0, 10);
  const isFiltered = selectedGenre !== 'All' || viewMode === 'grid';
  const displayedCount = isFiltered ? results.length : initialTrending.length + initialPopular.length;

  return (
    <div>
      {/* ─── Netflix Sub-Navigation (Title + Genre Dropdown + View Mode) ─── */}
      <NetflixSubNav
        title="Movies"
        genres={MOVIE_GENRES}
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
              {selectedGenre === 'All' ? 'All Movies' : `${selectedGenre} Movies`}
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
              title="No movies found"
              message={`No movies found for ${selectedGenre}. Try selecting another genre.`}
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
              {results.map((m) => (
                <MovieCard key={m.id} movie={m} onSelect={() => setSelectedMovie(m)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── Netflix Curated Rows View (Default) ─── */
        <>
          {heroMovie && (
            <div style={{ marginBottom: '40px' }}>
              <MovieHero movie={heroMovie} />
            </div>
          )}

          {/* Trending Blockbusters */}
          {initialTrending.length > 0 && (
            <NetflixRow
              title="Trending Movies"
              icon={<Flame size={22} color="var(--accent)" />}
              items={toRowItems(initialTrending)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Top 10 in Movies Today */}
          {top10.length > 0 && (
            <NetflixRow
              title="Top 10 Movies Today"
              icon={<Trophy size={22} color="#f59e0b" />}
              items={toRowItems(top10)}
              isTop10={true}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Action & Adventure */}
          {actionMovies.length > 0 && (
            <NetflixRow
              title="Action & Adventure Blockbusters"
              icon={<Clapperboard size={22} color="var(--accent)" />}
              items={toRowItems(actionMovies)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Sci-Fi & Fantasy */}
          {scifiMovies.length > 0 && (
            <NetflixRow
              title="Sci-Fi & Fantasy Epics"
              icon={<Compass size={22} color="var(--accent)" />}
              items={toRowItems(scifiMovies)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Critically Acclaimed Dramas */}
          {dramaMovies.length > 0 && (
            <NetflixRow
              title="Critically Acclaimed Dramas"
              icon={<Film size={22} color="var(--accent)" />}
              items={toRowItems(dramaMovies)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Comedy Hits */}
          {comedyMovies.length > 0 && (
            <NetflixRow
              title="Laugh-Out-Loud Comedies"
              icon={<Film size={22} color="var(--accent)" />}
              items={toRowItems(comedyMovies)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Chilling Thrillers & Horror */}
          {horrorMovies.length > 0 && (
            <NetflixRow
              title="Chilling Horror & Thrillers"
              icon={<Film size={22} color="var(--accent)" />}
              items={toRowItems(horrorMovies)}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {/* Animation & Anime */}
          {animationMovies.length > 0 && (
            <NetflixRow
              title="Animation & Family Hits"
              icon={<Film size={22} color="var(--accent)" />}
              items={toRowItems(animationMovies)}
              onSelectMedia={handleSelectMedia}
            />
          )}
        </>
      )}

      {/* Netflix Quick-Preview Modal */}
      <MediaModal
        item={selectedMovie}
        type="movie"
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}

export default MoviesExplorer;
