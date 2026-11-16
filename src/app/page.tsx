'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Layers, Tv, Sparkles, History } from 'lucide-react';
import { NetflixBillboard, BillboardItem } from '@/components/home/NetflixBillboard';
import { NetflixRow, RowMediaItem } from '@/components/home/NetflixRow';
import { FilterBar } from '@/components/channels/filters/FilterBar';
import { ChannelGrid } from '@/components/channels/ChannelGrid';
import { Pagination } from '@/components/common/Pagination';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { MediaModal } from '@/components/common/MediaModal';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { useOfflineChannels } from '@/hooks/useOfflineChannels';
import { useChannels } from '@/hooks/useChannels';
import { IChannel, ICategory, ICountry, ITMDBMovie, ISeries } from '@/lib/types';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<IChannel | null>(null);

  // Netflix V2 Media Rows state
  const [trendingMovies, setTrendingMovies] = useState<ITMDBMovie[]>([]);
  const [popularMovies, setPopularMovies] = useState<ITMDBMovie[]>([]);
  const [popularSeries, setPopularSeries] = useState<ISeries[]>([]);
  const [sportsChannels, setSportsChannels] = useState<IChannel[]>([]);
  const [activeModalItem, setActiveModalItem] = useState<any | null>(null);

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [countries, setCountries] = useState<ICountry[]>([]);

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { history, removeFromHistory } = useWatchHistory();
  const { offlineChannels, markOffline, markOnline } = useOfflineChannels();

  const { channels, page, setPage, totalPages, total, isLoading } = useChannels({
    category: selectedCategory,
    country: selectedCountry,
    search: searchQuery,
    favoritesOnly: showFavoritesOnly,
    favorites,
  });

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => {});
    fetch('/api/countries').then((r) => r.json()).then((d) => setCountries(d.countries || [])).catch(() => {});
    fetch('/api/movies/trending').then((r) => r.json()).then((d) => setTrendingMovies(d.results || d.movies || [])).catch(() => {});
    fetch('/api/movies/popular').then((r) => r.json()).then((d) => setPopularMovies(d.results || d.movies || [])).catch(() => {});
    fetch('/api/series/search?sortBy=rating&page=1').then((r) => r.json()).then((d) => setPopularSeries(d.results || d.series || [])).catch(() => {});
    fetch('/api/channels?category=sports&limit=15').then((r) => r.json()).then((d) => setSportsChannels(d.channels || [])).catch(() => {});
  }, []);

  const isDefaultView = selectedCategory === 'all' && selectedCountry === 'ALL' && !searchQuery && !showFavoritesOnly;

  // Format Continue Watching for NetflixRow
  const continueWatchingItems: RowMediaItem[] = history.map((h) => ({
    id: h.id,
    type: h.type,
    title: h.title,
    poster: h.poster,
    backdrop: h.backdrop,
    progressPercent: h.progressPercent,
    season: h.season,
    episode: h.episode,
  }));

  // Format Trending Movies
  const trendingRowItems: RowMediaItem[] = trendingMovies.map((m) => ({
    id: String(m.id),
    type: 'movie',
    title: m.title,
    poster: m.poster_path,
    backdrop: m.backdrop_path,
    rating: m.vote_average,
    year: String(m.release_date || '').substring(0, 4),
  }));

  // Format Top 10 Movies
  const top10Movies: RowMediaItem[] = popularMovies.slice(0, 10).map((m) => ({
    id: String(m.id),
    type: 'movie',
    title: m.title,
    poster: m.poster_path,
    backdrop: m.backdrop_path,
    rating: m.vote_average,
    year: String(m.release_date || '').substring(0, 4),
  }));

  // Format Popular Series
  const seriesRowItems: RowMediaItem[] = popularSeries.map((s) => ({
    id: String(s.id),
    type: 'series',
    title: s.title,
    poster: s.poster,
    backdrop: s.backdrop,
    rating: s.rating,
    year: String(s.year || '').substring(0, 4),
  }));

  // Format Top 10 Series
  const top10Series: RowMediaItem[] = popularSeries.slice(0, 10).map((s) => ({
    id: String(s.id),
    type: 'series',
    title: s.title,
    poster: s.poster,
    backdrop: s.backdrop,
    rating: s.rating,
    year: String(s.year || '').substring(0, 4),
  }));

  // Format Sports Channels
  const sportsRowItems: RowMediaItem[] = sportsChannels.map((c) => ({
    id: c.id,
    type: 'channel',
    title: c.name,
    poster: c.logo,
    backdrop: c.logo,
    categories: c.categories,
    channelData: c,
  }));

  const handleOpenModal = (item: any) => {
    setActiveModalItem(item);
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* ─── Netflix Cinematic Billboard ─── */}
      {isDefaultView && (
        <NetflixBillboard
          onOpenModal={handleOpenModal}
          onPlayChannel={setSelectedChannel}
        />
      )}

      <div className="container" style={{ marginTop: isDefaultView ? '24px' : '40px' }}>
        {/* ─── Netflix Content Shelves ─── */}
        {isDefaultView && page === 1 && (
          <div style={{ marginBottom: '40px' }}>
            {/* Continue Watching Row */}
            {continueWatchingItems.length > 0 && (
              <NetflixRow
                title="Continue Watching for You"
                icon={<History size={22} color="var(--accent)" />}
                items={continueWatchingItems}
                isContinueWatching={true}
                onSelectMedia={handleOpenModal}
                onRemoveHistory={removeFromHistory}
              />
            )}

            {/* Trending Now */}
            {trendingRowItems.length > 0 && (
              <NetflixRow
                title="Trending Now"
                icon={<Flame size={22} color="var(--accent)" />}
                items={trendingRowItems}
                viewAllHref="/movies"
                onSelectMedia={handleOpenModal}
              />
            )}

            {/* Top 10 Movies in India / Global Today */}
            {top10Movies.length > 0 && (
              <NetflixRow
                title="Top 10 Movies Today"
                icon={<Trophy size={22} color="#f59e0b" />}
                items={top10Movies}
                isTop10={true}
                viewAllHref="/movies"
                onSelectMedia={handleOpenModal}
              />
            )}

            {/* Binge-Worthy TV Series */}
            {seriesRowItems.length > 0 && (
              <NetflixRow
                title="Popular TV Shows & Series"
                icon={<Layers size={22} color="var(--accent)" />}
                items={seriesRowItems}
                viewAllHref="/series"
                onSelectMedia={handleOpenModal}
              />
            )}

            {/* Top 10 TV Shows Today */}
            {top10Series.length > 0 && (
              <NetflixRow
                title="Top 10 TV Shows Today"
                icon={<Trophy size={22} color="#f59e0b" />}
                items={top10Series}
                isTop10={true}
                viewAllHref="/series"
                onSelectMedia={handleOpenModal}
              />
            )}

            {/* Global Live Sports Channels */}
            {sportsRowItems.length > 0 && (
              <NetflixRow
                title="Live Sports & Action Broadcasts"
                icon={<Tv size={22} color="var(--accent)" />}
                items={sportsRowItems}
                viewAllHref="/#live-directory"
                onPlayChannel={setSelectedChannel}
              />
            )}
          </div>
        )}

        {/* ─── Live Television Directory ─── */}
        <div id="live-directory" style={{ marginTop: isDefaultView ? '24px' : '0', scrollMarginTop: '80px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tv size={22} color="var(--accent)" />
                <span>Global Live IPTV Channels</span>
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Free live broadcasts from around the world. Filter by genre or country.
              </p>
            </div>
          </div>

          <FilterBar
            categories={categories}
            countries={countries}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            totalChannels={total}
          />

          <ChannelGrid
            channels={channels}
            isLoading={isLoading}
            selectedChannelId={selectedChannel?.id}
            favorites={favorites}
            offlineChannels={offlineChannels}
            onSelectChannel={setSelectedChannel}
            onToggleFavorite={toggleFavorite}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ─── Netflix Quick Preview Modal ─── */}
      <MediaModal
        item={activeModalItem}
        type={activeModalItem?.type || 'movie'}
        isOpen={!!activeModalItem}
        onClose={() => setActiveModalItem(null)}
      />

      {/* ─── Live HLS Video Player ─── */}
      <VideoPlayer
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
        isFavorite={selectedChannel ? isFavorite(selectedChannel.id) : false}
        onToggleFavorite={toggleFavorite}
        playlistChannels={channels}
        onSelectChannel={setSelectedChannel}
        onChannelOffline={markOffline}
        onChannelOnline={markOnline}
      />
    </main>
  );
}
