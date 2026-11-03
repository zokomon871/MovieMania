'use client';

import React from 'react';
import { IChannel } from '@/lib/types';
import { ChannelCard } from './ChannelCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

interface ChannelGridProps {
  channels: IChannel[];
  isLoading: boolean;
  selectedChannelId?: string;
  favorites: string[];
  offlineChannels?: string[];
  onSelectChannel: (channel: IChannel) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onResetFilters?: () => void;
}

export function ChannelGrid({
  channels,
  isLoading,
  selectedChannelId,
  favorites,
  offlineChannels = [],
  onSelectChannel,
  onToggleFavorite,
  onResetFilters,
}: ChannelGridProps) {
  if (isLoading) {
    return <LoadingSpinner label="Searching & loading channels..." />;
  }

  if (channels.length === 0) {
    return <EmptyState onReset={onResetFilters} />;
  }

  return (
    <div className="channels-grid">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          isSelected={selectedChannelId === channel.id}
          isFavorite={favorites.includes(channel.id)}
          isOffline={offlineChannels.includes(channel.id)}
          onSelect={onSelectChannel}
          onToggleFavorite={onToggleFavorite}
          isGridView
        />
      ))}
    </div>
  );
}
export default ChannelGrid;

