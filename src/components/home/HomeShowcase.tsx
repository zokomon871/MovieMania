'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Layers, Newspaper, Tv } from 'lucide-react';
import { ITMDBMovie, ISeries, IChannel } from '@/lib/types';
import { MediaRow } from '@/components/common/MediaRow';
import { ChannelRow } from '@/components/channels/ChannelRow';

interface HomeShowcaseProps {
  selectedChannelId?: string;
  favorites: string[];
  offlineChannels?: string[];
  onSelectChannel: (channel: IChannel) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export function HomeShowcase({
  selectedChannelId,
  favorites,
  offlineChannels = [],
  onSelectChannel,
  onToggleFavorite,
}: HomeShowcaseProps) {
  const [trendingMovies, setTrendingMovies] = useState<ITMDBMovie[]>([]);
  const [popularMovies, setPopularMovies] = useState<ITMDBMovie[]>([]);
  const [popularSeries, setPopularSeries] = useState<ISeries[]>([]);
  const [sportsChannels, setSportsChannels] = useState<IChannel[]>([]);
  const [newsChannels, setNewsChannels] = useState<IChannel[]>([]);

  useEffect(() => {
    fetch('/api/movies/trending').then((r) => r.json()).then((d) => setTrendingMovies(d.movies || [])).catch(() => {});
    fetch('/api/movies/popular').then((r) => r.json()).then((d) => setPopularMovies(d.movies || [])).catch(() => {});
    fetch('/api/series/search?sortBy=rating&page=1').then((r) => r.json()).then((d) => setPopularSeries(d.results || [])).catch(() => {});
    fetch('/api/channels?category=sports&limit=15').then((r) => r.json()).then((d) => setSportsChannels(d.channels || [])).catch(() => {});
    fetch('/api/channels?category=news&limit=15').then((r) => r.json()).then((d) => setNewsChannels(d.channels || [])).catch(() => {});
  }, []);

  const top10 = popularMovies.slice(0, 10);

  return (
    <div className="home-showcase-shelves">
      {trendingMovies.length > 0 && (
        <MediaRow
          title="Trending Now"
          icon={<Flame size={20} color="var(--accent)" />}
          items={trendingMovies}
          type="movie"
          viewAllHref="/movies"
        />
      )}

      {top10.length > 0 && (
        <MediaRow
          title="Top 10 Movies Today"
          icon={<Trophy size={20} color="#f59e0b" />}
          items={top10}
          type="movie"
          showRank={true}
          viewAllHref="/movies"
        />
      )}

      {popularSeries.length > 0 && (
        <MediaRow
          title="Popular TV Shows"
          icon={<Layers size={20} color="var(--accent)" />}
          items={popularSeries}
          type="series"
          viewAllHref="/series"
        />
      )}

      {sportsChannels.length > 0 && (
        <ChannelRow
          title="Global Live Sports"
          icon={<Trophy size={20} color="var(--accent)" />}
          channels={sportsChannels}
          selectedChannelId={selectedChannelId}
          favorites={favorites}
          offlineChannels={offlineChannels}
          onSelectChannel={onSelectChannel}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {newsChannels.length > 0 && (
        <ChannelRow
          title="24/7 Global Breaking News"
          icon={<Newspaper size={20} color="var(--info)" />}
          channels={newsChannels}
          selectedChannelId={selectedChannelId}
          favorites={favorites}
          offlineChannels={offlineChannels}
          onSelectChannel={onSelectChannel}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
}

export default HomeShowcase;

