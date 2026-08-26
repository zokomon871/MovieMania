'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import HeroBillboard from '@/components/HeroBillboard';
import ChannelRow from '@/components/ChannelRow';
import FilterBar from '@/components/FilterBar';
import VideoPlayer from '@/components/VideoPlayer';
import ChannelCard from '@/components/ChannelCard';
import { IChannel, ICategory, ICountry } from '@/lib/types';
import {
  Tv,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Newspaper,
  Film,
  Compass,
  Star,
} from 'lucide-react';

export default function HomePage() {
  const [channels, setChannels] = useState<IChannel[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<IChannel | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Category Row Specific Channels
  const [sportsChannels, setSportsChannels] = useState<IChannel[]>([]);
  const [newsChannels, setNewsChannels] = useState<IChannel[]>([]);
  const [movieChannels, setMovieChannels] = useState<IChannel[]>([]);
  const [animationChannels, setAnimationChannels] = useState<IChannel[]>([]);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Pagination & Loading States
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Load Favorites from LocalStorage on mount
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('streamhub_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      console.warn('Failed to load localStorage items:', e);
    }
  }, []);

  // Save Favorites
  const toggleFavorite = (channelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem('streamhub_favorites', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Select Channel and smoothly scroll to video player
  const handleSelectChannel = (channel: IChannel) => {
    setSelectedChannel(channel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Fetch Countries on mount
  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((data) => {
        if (data.countries?.length) setCountries(data.countries);
      })
      .catch(console.warn);
  }, []);

  // 2. Dynamically fetch Category Counts whenever selectedCountry changes
  useEffect(() => {
    const url = selectedCountry && selectedCountry !== 'ALL'
      ? `/api/categories?country=${encodeURIComponent(selectedCountry)}`
      : '/api/categories';

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.warn);
  }, [selectedCountry]);

  // 3. Fetch Category Row Datasets in parallel for 1Flex homepage carousels
  useEffect(() => {
    fetch('/api/channels?category=sports&limit=16')
      .then((r) => r.json())
      .then((data) => {
        if (data.channels?.length) setSportsChannels(data.channels);
      })
      .catch(console.warn);

    fetch('/api/channels?category=news&limit=16')
      .then((r) => r.json())
      .then((data) => {
        if (data.channels?.length) setNewsChannels(data.channels);
      })
      .catch(console.warn);

    fetch('/api/channels?category=movies&limit=16')
      .then((r) => r.json())
      .then((data) => {
        if (data.channels?.length) setMovieChannels(data.channels);
      })
      .catch(console.warn);

    fetch('/api/channels?category=animation&limit=16')
      .then((r) => r.json())
      .then((data) => {
        if (data.channels?.length) setAnimationChannels(data.channels);
      })
      .catch(console.warn);
  }, []);

  // Fetch Channels with Filter / Search / Pagination
  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '36');

      if (showFavoritesOnly) {
        if (favorites.length === 0) {
          setChannels([]);
          setTotalCount(0);
          setTotalPages(1);
          setIsLoading(false);
          return;
        }
        params.set('favorites', favorites.join(','));
      } else {
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
        if (selectedCountry && selectedCountry !== 'ALL') params.set('country', selectedCountry);
      }

      const res = await fetch(`/api/channels?${params.toString()}`);
      const data = await res.json();

      if (data.channels && data.channels.length > 0) {
        setChannels(data.channels);
        setTotalCount(data.total || data.channels.length);
        setTotalPages(data.totalPages || 1);
      } else {
        setChannels([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn('Error loading channels from API:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, selectedCategory, selectedCountry, showFavoritesOnly, favorites]);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchChannels();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedCountry, showFavoritesOnly]);

  // Trigger DB Sync Pipeline
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncNotice('Starting IPTV live database synchronization...');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncNotice(`Sync complete! Ingested ${data.stats?.totalJoinedChannels?.toLocaleString() || 9979} live broadcast channels.`);
        fetchChannels();
        fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories || []));
        fetch('/api/countries').then((r) => r.json()).then((d) => setCountries(d.countries || []));
      } else {
        setSyncNotice('Sync failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setSyncNotice('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const isBrowsingAll = !showFavoritesOnly && !searchQuery && selectedCategory === 'all' && selectedCountry === 'ALL';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1Flex Sticky Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
        favoriteCount={favorites.length}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className="container" style={{ flex: 1, padding: '28px 32px 60px' }}>
        {/* Sync Status Notification Toast */}
        {syncNotice && (
          <div
            className="glass-panel"
            style={{
              padding: '14px 22px',
              marginBottom: '24px',
              borderLeft: '4px solid var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.92rem',
              fontWeight: 600,
            }}
          >
            <span>{syncNotice}</span>
            <button className="btn btn-ghost" style={{ padding: '2px 8px' }} onClick={() => setSyncNotice(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Video Player (Cinema Mode) */}
        {selectedChannel ? (
          <VideoPlayer
            channel={selectedChannel}
            isFavorite={favorites.includes(selectedChannel.id)}
            onToggleFavorite={toggleFavorite}
            onClose={() => setSelectedChannel(null)}
            playlistChannels={channels}
            onSelectChannel={handleSelectChannel}
          />
        ) : (
          /* Hero Billboard shown when player is inactive */
          isBrowsingAll && (
            <HeroBillboard
              featuredChannels={channels}
              onSelectChannel={handleSelectChannel}
              isFavorite={false}
              onToggleFavorite={toggleFavorite}
            />
          )
        )}

        {/* Horizontal Sliding Rows (1Flex Homepage Experience) */}
        {isBrowsingAll && !selectedChannel && (
          <>
            {/* Row 1: Trending Live Broadcasts */}
            {channels.length > 0 && (
              <ChannelRow
                title="Trending Live Broadcasts"
                icon={<Flame size={24} color="var(--accent-red)" />}
                channels={channels.slice(0, 16)}
                favorites={favorites}
                onSelectChannel={handleSelectChannel}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {/* Row 2: Sports & Live Events */}
            {sportsChannels.length > 0 && (
              <ChannelRow
                title="Sports & Live Action"
                icon={<Trophy size={24} color="#38bdf8" />}
                channels={sportsChannels}
                favorites={favorites}
                onSelectChannel={handleSelectChannel}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {/* Row 3: Breaking News */}
            {newsChannels.length > 0 && (
              <ChannelRow
                title="World News & Global Affairs"
                icon={<Newspaper size={24} color="#f59e0b" />}
                channels={newsChannels}
                favorites={favorites}
                onSelectChannel={handleSelectChannel}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {/* Row 4: Movies & Cinema */}
            {movieChannels.length > 0 && (
              <ChannelRow
                title="Movies & Feature Cinema"
                icon={<Film size={24} color="#ec4899" />}
                channels={movieChannels}
                favorites={favorites}
                onSelectChannel={handleSelectChannel}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {/* Row 5: Animation & Kids */}
            {animationChannels.length > 0 && (
              <ChannelRow
                title="Kids & Animation"
                icon={<Tv size={24} color="#10b981" />}
                channels={animationChannels}
                favorites={favorites}
                onSelectChannel={handleSelectChannel}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </>
        )}

        {/* Category Discovery & Filter Bar */}
        {!showFavoritesOnly && (
          <div style={{ marginTop: isBrowsingAll && !selectedChannel ? '24px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Compass size={22} color="var(--accent-red)" />
              <h2 className="font-display" style={{ fontSize: '1.9rem', color: '#fff' }}>
                {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory !== 'all' ? `${selectedCategory.toUpperCase()} CHANNELS` : 'EXPLORE ALL LIVE CHANNELS'}
              </h2>
            </div>

            <FilterBar
              categories={categories}
              countries={countries}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedCountry={selectedCountry}
              onSelectCountry={setSelectedCountry}
              totalChannels={totalCount}
            />
          </div>
        )}

        {/* Favorites Header if in Favorites mode */}
        {showFavoritesOnly && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={24} fill="var(--accent-gold)" color="var(--accent-gold)" />
              <h2 className="font-display" style={{ fontSize: '2.2rem', color: '#fff' }}>
                SAVED FAVORITE CHANNELS ({favorites.length})
              </h2>
            </div>
            <button onClick={() => setShowFavoritesOnly(false)} className="btn btn-ghost">
              Browse All Channels
            </button>
          </div>
        )}

        {/* Main Channel Grid */}
        {isLoading ? (
          <div className="channel-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="channel-card skeleton channel-card-grid" />
            ))}
          </div>
        ) : channels.length > 0 ? (
          <div className="channel-grid">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isSelected={selectedChannel?.id === channel.id}
                isFavorite={favorites.includes(channel.id)}
                onSelect={handleSelectChannel}
                onToggleFavorite={toggleFavorite}
                isGridView
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', margin: '40px 0' }}>
            <Tv size={56} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 className="font-display" style={{ fontSize: '2rem', color: '#fff', marginBottom: '8px' }}>No Live Channels Found</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
              {showFavoritesOnly
                ? "You haven't saved any favorite channels yet. Click the star icon on any channel to pin it here for instant access."
                : "No broadcast feeds matched your search query. Try clearing your filters or refreshing the channel list."}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedCountry('ALL');
                  setShowFavoritesOnly(false);
                }}
                className="btn btn-secondary"
              >
                Reset All Filters
              </button>
              <button onClick={handleTriggerSync} className="btn btn-primary">
                <RefreshCw size={16} /> Sync IPTV Database
              </button>
            </div>
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              disabled={page === 1}
              className="btn btn-ghost"
              style={{ opacity: page === 1 ? 0.35 : 1 }}
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Page <strong style={{ color: '#fff' }}>{page}</strong> of <strong style={{ color: '#fff' }}>{totalPages}</strong>
            </span>
            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              disabled={page === totalPages}
              className="btn btn-ghost"
              style={{ opacity: page === totalPages ? 0.35 : 1 }}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </main>

      {/* 1Flex Dark Cinema Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '40px 0',
          background: 'var(--bg-oled)',
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
        }}
      >
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
          <div className="logo-brand">
            <div className="logo-icon-badge" style={{ width: '30px', height: '30px' }}>
              <Tv size={16} color="#fff" />
            </div>
            <div className="logo-text" style={{ fontSize: '1.5rem' }}>
              STREAM<span>HUB</span>
            </div>
          </div>
          <p style={{ maxWidth: '650px', lineHeight: 1.6 }}>
            StreamHub is a free global live TV streaming interface. Streams are delivered via public HLS endpoints indexed by the open-source community.
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} StreamHub • Built with Next.js 14, MongoDB & Redis
          </div>
        </div>
      </footer>
    </div>
  );
}
