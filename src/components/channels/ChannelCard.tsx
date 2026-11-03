'use client';

import React, { useState } from 'react';
import { Tv, Star, Play } from 'lucide-react';
import { IChannel } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';

interface ChannelCardProps {
  channel: IChannel;
  isSelected?: boolean;
  isFavorite?: boolean;
  isOffline?: boolean;
  onSelect: (channel: IChannel) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  isGridView?: boolean;
}

export function ChannelCard({
  channel,
  isSelected = false,
  isFavorite = false,
  isOffline = false,
  onSelect,
  onToggleFavorite,
  isGridView = false,
}: ChannelCardProps) {
  const [imgError, setImgError] = useState(false);
  const streamCount = channel.streams?.length || 0;
  const effectiveIsOffline = isOffline || streamCount === 0 || channel.streams?.every((s) => s.status === 'offline');
  const bestQuality = effectiveIsOffline ? undefined : channel.streams?.find((s) => s.quality)?.quality || (streamCount > 0 ? 'HD' : undefined);
  const primaryCategory = channel.categories?.[0] || 'General';

  return (
    <div
      className={`channel-card ${isGridView ? 'channel-card-grid' : ''} ${isSelected ? 'playing' : ''} ${effectiveIsOffline ? 'offline' : ''}`}
      onClick={() => onSelect(channel)}
    >
      <div className="card-play-hover-overlay">
        <div className="card-play-bubble">
          <Play size={20} fill="#fff" style={{ marginLeft: '3px' }} />
        </div>
      </div>

      <div className="card-top">
        <div className="card-logo-container">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="card-logo-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <Tv size={22} color="var(--text-muted)" />
          )}
        </div>

        <button
          onClick={(e) => onToggleFavorite(channel.id, e)}
          className={`card-favorite-btn ${isFavorite ? 'active' : ''}`}
          title={isFavorite ? 'Remove bookmark' : 'Bookmark channel'}
        >
          <Star size={16} fill={isFavorite ? 'var(--accent)' : 'transparent'} color={isFavorite ? 'var(--accent)' : 'currentColor'} />
        </button>
      </div>

      <div className="card-body">
        <h3 className="card-title" title={channel.name}>
          {channel.name}
        </h3>
        <div className="card-meta">
          {channel.country && <span>🏳️ {channel.country}</span>}
          {channel.network && <span>• {channel.network}</span>}
          {channel.languages?.[0] && <span>• {channel.languages[0].toUpperCase()}</span>}
        </div>
      </div>

      <div className="card-bottom">
        <StatusBadge isOffline={effectiveIsOffline} isVerified={channel.is_verified ?? true} quality={bestQuality} />
        <span className="badge badge-category" style={{ textTransform: 'capitalize' }}>
          {primaryCategory}
        </span>
      </div>
    </div>
  );
}
export default ChannelCard;

