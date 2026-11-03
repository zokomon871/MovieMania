import React from 'react';
import { Star, X, Tv } from 'lucide-react';
import { IChannel } from '@/lib/types';

interface PlayerHeaderProps {
  channel: IChannel;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClose?: () => void;
  qualityLabel?: string;
  usingProxy?: boolean;
}

export function PlayerHeader({ channel, isFavorite, onToggleFavorite, onClose, qualityLabel, usingProxy }: PlayerHeaderProps) {
  const meta = [channel.country, channel.categories?.[0] ?? 'Broadcast', channel.languages?.[0]?.toUpperCase()].filter(Boolean);

  return (
    <div className="player-header" onClick={(e) => e.stopPropagation()}>
      <div className="player-header-info">
        <div className="player-header-logo">
          {channel.logo ? <img src={channel.logo} alt="" /> : <Tv size={20} />}
        </div>
        <div className="player-header-text">
          <div className="player-header-title-row">
            <h2 className="player-header-title">{channel.name}</h2>
            <span className="player-live-badge">
              <span className="dot" /> LIVE
            </span>
          </div>
          <div className="player-header-meta">
            {meta.map((m, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">•</span>}
                <span style={{ textTransform: 'capitalize' }}>{m}</span>
              </React.Fragment>
            ))}
            {qualityLabel && <span className="player-chip">{qualityLabel}</span>}
            {usingProxy && <span className="player-chip muted" title="Streaming through the app's relay to bypass CORS">Relay</span>}
          </div>
        </div>
      </div>

      <div className="player-header-actions">
        <button
          onClick={(e) => onToggleFavorite(channel.id, e)}
          className={`player-round-btn ${isFavorite ? 'active' : ''}`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          data-tip={isFavorite ? 'Favorited' : 'Favorite'}
        >
          <Star size={18} fill={isFavorite ? 'currentColor' : 'transparent'} />
        </button>
        {onClose && (
          <button onClick={onClose} className="player-round-btn" aria-label="Close player" data-tip="Close (Esc)">
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
