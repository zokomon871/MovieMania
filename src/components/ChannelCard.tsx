'use client';

import React, { useState } from 'react';
import { Tv, Star, Play, ShieldCheck, HelpCircle } from 'lucide-react';
import { IChannel } from '@/lib/types';

interface ChannelCardProps {
  channel: IChannel;
  isSelected?: boolean;
  isFavorite?: boolean;
  onSelect: (channel: IChannel) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  isGridView?: boolean;
}

export default function ChannelCard({
  channel,
  isSelected = false,
  isFavorite = false,
  onSelect,
  onToggleFavorite,
  isGridView = false,
}: ChannelCardProps) {
  const [imgError, setImgError] = useState(false);
  const streamCount = channel.streams?.length || 0;
  const bestQuality = channel.streams?.find((s) => s.quality)?.quality || (streamCount > 0 ? 'HD' : 'OFFLINE');
  const primaryCategory = channel.categories?.[0] || 'General';
  const isVerified = channel.is_verified ?? true;

  return (
    <div
      className={`channel-card ${isGridView ? 'channel-card-grid' : ''} ${isSelected ? 'playing' : ''}`}
      onClick={() => onSelect(channel)}
    >
      {/* Play Hover Overlay Bubble */}
      <div className="card-play-hover-overlay">
        <div className="card-play-bubble">
          <Play size={20} fill="#fff" style={{ marginLeft: '3px' }} />
        </div>
      </div>

      {/* Card Header: Logo & Favorite */}
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
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={16} fill={isFavorite ? 'var(--accent-gold)' : 'transparent'} color={isFavorite ? 'var(--accent-gold)' : 'currentColor'} />
        </button>
      </div>

      {/* Card Body: Title & Meta */}
      <div className="card-body">
        <h3 className="card-title" title={channel.name}>
          {channel.name}
        </h3>
        <div className="card-meta">
          {channel.country && <span>🏳️ {channel.country}</span>}
          {channel.network && <span>• {channel.network}</span>}
          {channel.languages && channel.languages[0] && <span>• {channel.languages[0].toUpperCase()}</span>}
        </div>
      </div>

      {/* Card Footer: Badges */}
      <div className="card-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Status Badge: Verified vs Community Feed */}
          {isVerified ? (
            <span
              className="badge"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}
              title="Verified High Reliability Broadcast Stream"
            >
              <span className="pulse-dot" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              24/7 LIVE
            </span>
          ) : (
            <span
              className="badge"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
              title="Community / Unverified Feed"
            >
              <span className="pulse-dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
              COMMUNITY
            </span>
          )}

          <span className="badge badge-quality">
            {bestQuality}
          </span>
        </div>

        <span className="badge badge-category" style={{ textTransform: 'capitalize' }}>
          {primaryCategory}
        </span>
      </div>
    </div>
  );
}
