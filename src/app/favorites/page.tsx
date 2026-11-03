'use client';

import React, { useState } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useChannels } from '@/hooks/useChannels';
import { useOfflineChannels } from '@/hooks/useOfflineChannels';
import { ChannelGrid } from '@/components/channels/ChannelGrid';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { IChannel } from '@/lib/types';
import { Star } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { offlineChannels, markOffline, markOnline } = useOfflineChannels();
  const [selectedChannel, setSelectedChannel] = useState<IChannel | null>(null);

  const { channels, isLoading } = useChannels({
    category: 'all',
    country: 'ALL',
    search: '',
    favoritesOnly: true,
    favorites,
  });

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container" style={{ paddingTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Star size={28} color="var(--accent)" fill="var(--accent)" />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0 }}>
            My Bookmarks
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Quick access to your saved favorite live broadcast channels.
        </p>

        <ChannelGrid
          channels={channels}
          isLoading={isLoading}
          selectedChannelId={selectedChannel?.id}
          favorites={favorites}
          offlineChannels={offlineChannels}
          onSelectChannel={setSelectedChannel}
          onToggleFavorite={toggleFavorite}
        />
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

