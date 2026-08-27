'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { IChannel } from '@/lib/types';
import ChannelCard from './ChannelCard';

interface ChannelRowProps {
  title: string;
  icon?: React.ReactNode;
  channels: IChannel[];
  selectedChannelId?: string;
  favorites: string[];
  offlineChannels?: string[];
  onSelectChannel: (channel: IChannel) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export default function ChannelRow({
  title,
  icon,
  channels,
  selectedChannelId,
  favorites,
  offlineChannels = [],
  onSelectChannel,
  onToggleFavorite,
}: ChannelRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  useEffect(() => {
    checkScroll();
  }, [channels]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.75;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!channels || channels.length === 0) return null;

  return (
    <div className="row-section">
      {/* Row Header */}
      <div className="row-header">
        <div className="row-title-box">
          {icon}
          <h2 className="row-title">{title}</h2>
          <span className="row-count-badge">({channels.length})</span>
        </div>

        <div className="row-nav-controls">
          <button
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className="row-arrow-btn"
            title="Scroll Left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className="row-arrow-btn"
            title="Scroll Right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Sliding Channels Container */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className="row-carousel-container"
      >
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            isSelected={selectedChannelId === channel.id}
            isFavorite={favorites.includes(channel.id)}
            isOffline={offlineChannels.includes(channel.id)}
            onSelect={onSelectChannel}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
