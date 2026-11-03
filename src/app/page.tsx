'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { HeroBillboard } from '@/components/channels/HeroBillboard';
import { FilterBar } from '@/components/channels/filters/FilterBar';
import { ChannelRow } from '@/components/channels/ChannelRow';
import { ChannelGrid } from '@/components/channels/ChannelGrid';
import { Pagination } from '@/components/common/Pagination';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useFavorites } from '@/hooks/useFavorites';
import { useOfflineChannels } from '@/hooks/useOfflineChannels';
import { useChannels } from '@/hooks/useChannels';
import { IChannel, ICategory, ICountry } from '@/lib/types';
import { Trophy, Newspaper, Film, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<IChannel | null>(null);

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [sportsChannels, setSportsChannels] = useState<IChannel[]>([]);
  const [newsChannels, setNewsChannels] = useState<IChannel[]>([]);

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
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
    fetch('/api/channels?category=sports&limit=15').then((r) => r.json()).then((d) => setSportsChannels(d.channels || [])).catch(() => {});
    fetch('/api/channels?category=news&limit=15').then((r) => r.json()).then((d) => setNewsChannels(d.channels || [])).catch(() => {});
  }, []);

  const isDefaultView = selectedCategory === 'all' && selectedCountry === 'ALL' && !searchQuery && !showFavoritesOnly;

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
        favoriteCount={favorites.length}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {isDefaultView && (
        <HeroBillboard
          featuredChannels={channels}
          onSelectChannel={setSelectedChannel}
          isFavorite={selectedChannel ? isFavorite(selectedChannel.id) : false}
          onToggleFavorite={toggleFavorite}
        />
      )}

      <div className="container" style={{ marginTop: isDefaultView ? '24px' : '40px' }}>
        <FilterBar
          categories={categories}
          countries={countries}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          totalChannels={total}
        />

        {isDefaultView && page === 1 && (
          <>
            <ChannelRow
              title="Global Live Sports"
              icon={<Trophy size={20} color="var(--accent)" />}
              channels={sportsChannels}
              selectedChannelId={selectedChannel?.id}
              favorites={favorites}
              offlineChannels={offlineChannels}
              onSelectChannel={setSelectedChannel}
              onToggleFavorite={toggleFavorite}
            />
            <ChannelRow
              title="24/7 Global Breaking News"
              icon={<Newspaper size={20} color="var(--info)" />}
              channels={newsChannels}
              selectedChannelId={selectedChannel?.id}
              favorites={favorites}
              offlineChannels={offlineChannels}
              onSelectChannel={setSelectedChannel}
              onToggleFavorite={toggleFavorite}
            />
          </>
        )}

        <div style={{ marginTop: '36px' }}>
          <ChannelGrid
            channels={channels}
            isLoading={isLoading}
            selectedChannelId={selectedChannel?.id}
            favorites={favorites}
            offlineChannels={offlineChannels}
            onSelectChannel={setSelectedChannel}
            onToggleFavorite={toggleFavorite}
            onResetFilters={() => {
              setSelectedCategory('all');
              setSelectedCountry('ALL');
              setSearchQuery('');
              setShowFavoritesOnly(false);
            }}
          />

          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </div>

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

